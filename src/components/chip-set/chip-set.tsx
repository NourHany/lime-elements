import { Chip } from '@limetech/lime-elements';
import {
    MDCChipInteractionEvent,
    MDCChipSelectionEvent,
    MDCChipSet,
} from '@limetech/mdc-chips';
import { MDCTextField } from '@limetech/mdc-textfield';
import {
    Component,
    Element,
    Event,
    EventEmitter,
    h,
    Method,
    Prop,
    State,
    Watch,
} from '@stencil/core';

@Component({
    tag: 'limel-chip-set',
    shadow: true,
    styleUrl: 'chip-set.scss',
})
export class ChipSet {
    /**
     * List of chips for the set
     */
    @Prop()
    public value: Chip[] = [];

    /**
     * Type of chip set
     *
     * - `choice` renders a set of selectable chips where only one is selectable. The `removable` property is ignored
     * - `filter` renders a set of selectable chips where all are selectable. The `icon` property is ignored
     * - `input` renders a set of chips that can be used in conjunction with an input field
     *
     * If no type is set, a basic set of chips without additional functionality will be rendered
     */
    @Prop({ reflectToAttr: true })
    public type?: 'choice' | 'filter' | 'input';

    /**
     * Label to display for the input field when type is `input`
     */
    @Prop({ reflectToAttr: true })
    public label: string;

    /**
     * True if the chip set should be disabled
     */
    @Prop({ reflectToAttr: true })
    public disabled: boolean = false;

    /**
     * True if the control requires a value
     */
    @Prop({ reflectToAttr: true })
    public required: boolean = false;

    /**
     * Search label to display when type is `input` and component is in search mode
     */
    @Prop({ reflectToAttr: true })
    public searchLabel: string;

    /**
     * Whether the input field should be emptied when the chip-set loses focus.
     */
    @Prop({ reflectToAttr: true })
    public emptyInputOnBlur: boolean = true;

    /**
     * Dispatched when a chip is interacted with
     */
    @Event()
    private interact: EventEmitter<Chip>;

    /**
     * Dispatched when a chip is selected/deselected
     */
    @Event()
    private change: EventEmitter<Chip | Chip[]>;

    /**
     * Emitted when an input chip set has received focus and editing in the text field has started
     */
    @Event()
    private startEdit: EventEmitter<void>;

    /**
     * Emitted when an input chip set has lost focus and editing in the text field has ended
     */
    @Event()
    private stopEdit: EventEmitter<void>;

    /**
     * Dispatched when the input is changed for type `input`
     */
    @Event()
    private input: EventEmitter<string>;

    @Element()
    private host: HTMLElement;

    @State()
    private editMode: boolean = false;

    @State()
    private textValue: string = '';

    @State()
    private blurred: boolean = false;

    private mdcChipSet: MDCChipSet;
    private mdcTextField: MDCTextField;

    constructor() {
        this.renderChip = this.renderChip.bind(this);
        this.renderInputChip = this.renderInputChip.bind(this);
        this.handleInteraction = this.handleInteraction.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleTextFieldFocus = this.handleTextFieldFocus.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleTextInput = this.handleTextInput.bind(this);
        this.inputFieldOnChange = this.inputFieldOnChange.bind(this);
    }

    /**
     * Used to find out whether the chip-set is in edit mode.
     *
     * @returns {Promise<boolean>} `true` if the chip-set is in edit mode, `false` otherwise.
     */
    @Method()
    public async getEditMode(): Promise<boolean> {
        return this.editMode;
    }

    // tslint:disable-next-line:valid-jsdoc
    /**
     * Used to set focus to the chip-set input field.
     */
    @Method()
    public async setFocus() {
        this.editMode = true;
        this.host.shadowRoot.querySelector('input').focus();
    }

    /**
     * Used to empty the input field. Used in conjunction with `emptyInputOnBlur` to let the
     * consumer control when the input is emptied.
     *
     * @returns {Promise<void>} does not return anything, but methods have to be async
     */
    @Method()
    public async emptyInput() {
        this.textValue = '';
    }

    public componentDidLoad() {
        if (this.type === 'input') {
            this.mdcTextField = new MDCTextField(
                this.host.shadowRoot.querySelector('.mdc-text-field')
            );
        }

        this.createMDCChipSet();
    }

    public componentWillUpdate() {
        this.destroyMDCChipSet();
    }

    public componentDidUpdate() {
        this.createMDCChipSet();
        const input = this.host.shadowRoot.querySelector('input');
        if (input && this.editMode) {
            input.focus();
        }
    }

    public componentDidUnload() {
        this.destroyMDCChipSet();

        if (this.mdcTextField) {
            this.mdcTextField.destroy();
        }
    }

    public render() {
        if (this.type === 'input') {
            return this.renderInputChips();
        }

        let typeClass = '';
        if (this.type) {
            typeClass = `mdc-chip-set--${this.type}`;
        }

        return (
            <div class={`mdc-chip-set ${typeClass}`}>
                {this.value.map(this.renderChip)}
            </div>
        );
    }

    @Watch('value')
    protected handleChangeChips() {
        this.textValue = '';
    }

    private createMDCChipSet() {
        this.mdcChipSet = new MDCChipSet(
            this.host.shadowRoot.querySelector('.mdc-chip-set')
        );
        this.mdcChipSet.chips.forEach(chip => {
            chip.shouldRemoveOnTrailingIconClick = false;
        });

        if (!this.type || this.type === 'input') {
            this.mdcChipSet.listen(
                'MDCChip:interaction',
                this.handleInteraction
            );
        }

        if (this.type === 'choice' || this.type === 'filter') {
            this.mdcChipSet.listen('MDCChip:selection', this.handleSelection);
        }

        this.mdcChipSet.listen(
            'MDCChip:trailingIconInteraction',
            this.handleRemove
        );
    }

    private destroyMDCChipSet() {
        if (this.mdcChipSet) {
            this.mdcChipSet.unlisten(
                'MDCChip:interaction',
                this.handleInteraction
            );
            this.mdcChipSet.unlisten('MDCChip:selection', this.handleSelection);
            this.mdcChipSet.unlisten(
                'MDCChip:trailingIconInteraction',
                this.handleRemove
            );

            this.mdcChipSet.destroy();
        }
    }

    private renderInputChips() {
        return (
            <div
                class={{
                    'mdc-text-field': true,
                    'mdc-text-field--invalid': this.isInvalid(),
                }}
                onClick={this.handleTextFieldFocus}
            >
                <div class="mdc-chip-set mdc-chip-set--input">
                    {this.value.map(this.renderInputChip)}
                    <input
                        type="text"
                        id="my-text-field"
                        required={this.required}
                        disabled={this.disabled}
                        class="mdc-text-field__input"
                        value={this.textValue}
                        onBlur={this.handleInputBlur}
                        onFocus={this.handleTextFieldFocus}
                        onInput={this.handleTextInput}
                        // Some browsers emit a change event on input elements, we need to stop
                        // that event from propagating since we are emitting our own change event
                        onChange={this.inputFieldOnChange}
                        placeholder={this.searchLabel}
                    />
                </div>
                <label
                    class={{
                        'mdc-floating-label': true,
                        'mdc-text-field--disabled': this.disabled,
                        'mdc-text-field--required': this.required,
                        'force-float': !!(this.value.length || this.editMode),
                    }}
                    htmlFor="my-text-field"
                >
                    {this.label}
                </label>
                <div class="mdc-line-ripple" />
            </div>
        );
    }

    private isInvalid() {
        if (!this.required) {
            return;
        }

        if (!this.blurred) {
            return;
        }

        return !this.value || !this.value.length;
    }

    private inputFieldOnChange(event) {
        event.stopPropagation();
    }

    /**
     * Enter edit mode when the text field receives focus. When editMode is true, the input element will be visible
     * @returns {void}
     */
    private handleTextFieldFocus() {
        this.editMode = true;
        this.startEdit.emit();
    }

    /**
     * Exit edit mode when the input element loses focus. This makes sure the input element does not take up any
     * additional space when the user it not typing anything
     * @returns {void}
     */
    private handleInputBlur() {
        if (this.emptyInputOnBlur) {
            this.textValue = '';
        }
        this.editMode = false;
        this.blurred = true;

        // This timeout is needed in order to let a new element receive focus
        setTimeout(() => {
            this.stopEdit.emit();
        }, 0);
    }

    private handleTextInput(event) {
        event.stopPropagation();
        this.textValue = event.target.value;
        this.input.emit(event.target.value && event.target.value.trim());
    }

    private handleInteraction(event: MDCChipInteractionEvent) {
        const chip = this.value.find(item => {
            return `${item.id}` === event.detail.chipId;
        });
        this.interact.emit(chip);
    }

    private handleSelection(event: MDCChipSelectionEvent) {
        let chip = this.value.find(item => {
            return `${item.id}` === event.detail.chipId;
        });
        chip = { ...chip, selected: event.detail.selected };
        this.change.emit(chip);
    }

    private handleRemove(event: MDCChipInteractionEvent) {
        const newValue = this.value.filter(chip => {
            return `${chip.id}` !== event.detail.chipId;
        });
        this.change.emit(newValue);
    }

    private renderChip(chip: Chip) {
        switch (this.type) {
            case 'choice':
                return this.renderChoiceChip(chip);

            case 'filter':
                return this.renderFilterChip(chip);

            default:
                return this.renderDefaultChip(chip);
        }
    }

    private renderChoiceChip(chip: Chip) {
        return (
            <div
                class={`mdc-chip ${chip.selected ? 'mdc-chip--selected' : ''}`}
                tabindex="0"
                id={`${chip.id}`}
            >
                {chip.icon ? this.renderIcon(chip) : null}
                <div class="mdc-chip__text">{chip.text}</div>
            </div>
        );
    }

    private renderFilterChip(chip: Chip) {
        return (
            <div
                class={`mdc-chip ${chip.selected ? 'mdc-chip--selected' : ''}`}
                tabindex="0"
                id={`${chip.id}`}
            >
                <div class="mdc-chip__checkmark">
                    <svg class="mdc-chip__checkmark-svg" viewBox="-2 -3 30 30">
                        <path
                            class="mdc-chip__checkmark-path"
                            fill="none"
                            stroke="black"
                            d="M1.73,12.91 8.1,19.28 22.79,4.59"
                        />
                    </svg>
                </div>
                <div class="mdc-chip__text">{chip.text}</div>
            </div>
        );
    }

    private renderDefaultChip(chip: Chip) {
        return (
            <div class="mdc-chip" tabindex="0" id={`${chip.id}`}>
                {chip.icon ? this.renderIcon(chip) : null}
                <div class="mdc-chip__text">{chip.text}</div>
            </div>
        );
    }

    private renderInputChip(chip: Chip) {
        return (
            <div
                class="mdc-chip"
                id={`${chip.id}`}
                onClick={this.catchInputChipClicks}
            >
                {chip.icon ? this.renderIcon(chip) : null}
                <div class="mdc-chip__text">{chip.text}</div>
                {chip.removable ? this.renderTrailingIcon() : null}
            </div>
        );
    }

    private catchInputChipClicks(event) {
        event.stopPropagation();
    }

    private renderIcon(chip: Chip) {
        const style = {};
        if (chip.iconColor) {
            style['--icon-background-color'] = chip.iconColor;
        }

        return (
            <limel-icon
                class="mdc-chip__icon mdc-chip__icon--leading"
                name={chip.icon}
                style={style}
                size="small"
                badge={true}
            />
        );
    }

    private renderTrailingIcon() {
        return (
            <limel-icon
                class="mdc-chip__icon mdc-chip__icon--trailing"
                role="button"
                name="multiply"
            />
        );
    }
}
