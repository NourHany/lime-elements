import { Icon, ListSeparator } from '../../interface';

export type OpenDirection =
    | 'left-start'
    | 'left'
    | 'left-end'
    | 'right-start'
    | 'right'
    | 'right-end'
    | 'top-start'
    | 'top'
    | 'top-end'
    | 'bottom-start'
    | 'bottom'
    | 'bottom-end';

/**
 * Any element in the UI can be configured to open a menu.
 * By default width of menu's dropdown is based on the items in the dropdown.
 * However, size of the dropdown menu that opens can be controlled
 * based on design requirements.
 * - `inherit-from-items`: This is the default layout in which the widest item
 * in the menu list sets the width of the dropdown menu.
 * - `inherit-from-trigger`: Width of the dropdown menu will as wide as the
 * width of the element that triggers the menu.
 * - `inherit-from-menu`: Width of the dropdown menu will be as wide as the
 * width of the `limel-menu` element itself. Useful when a menu surface needs
 * to be opened programmatically, without a visible UI element.
 */
export type SurfaceWidth =
    | 'inherit-from-items'
    | 'inherit-from-trigger'
    | 'inherit-from-menu';

export interface MenuItem<T = any> {
    /**
     * The additional supporting text is used for shortcut commands and displayed in the menu item.
     */
    commandText?: string;

    /**
     * Text to display in the menu item.
     */
    text: string;

    /**
     * Additional supporting text to display in the menu item.
     */
    secondaryText?: string;

    /**
     * True if the menu item should be disabled.
     */
    disabled?: boolean;

    /**
     * Name of the icon to use.
     */
    icon?: string | Icon;

    /**
     * Background color of the icon. Overrides `--icon-background-color`.
     * @deprecated This property is deprecated and will be removed soon!
     *
     * Use the new `Icon` interface instead and write:
     * ```
     * icon {
     *    name: string,
     *    color: string,
     * },
     * ```
     */
    iconColor?: string;

    /**
     * True if the menu item should be selected.
     */
    selected?: boolean;

    /**
     * If specified, will display a notification badge on the buttons in the dock.
     */
    badge?: number | string;

    /**
     * Value of the menu item.
     */
    value?: T;

    /**
     * A way of defining a sub-menu for an item.
     * Set it to an array of `MenuItem`s
     */
    items?: Array<MenuItem<T> | ListSeparator>;

    /**
     * :::warning Internal Use Only
     * This property is for internal use only. We need it for now, but want to
     * find a better implementation of the functionality it currently enables.
     * If and when we do so, this property will be removed without prior
     * notice. If you use it, your code _will_ break in the future.
     * :::
     * @internal
     */
    parentItem?: MenuItem;
}
