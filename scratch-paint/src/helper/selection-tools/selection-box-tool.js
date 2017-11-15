import {rectSelect} from '../guides';
import {clearSelection, processRectangularSelection} from '../selection';

/** Tool to handle drag selection. A dotted line box appears and everything enclosed is selected. */
class SelectionBoxTool {
    /**
     * @param {!Modes} mode Current paint editor mode
     * @param {function} setSelectedItems Callback to set the set of selected items in the Redux state
     * @param {function} clearSelectedItems Callback to clear the set of selected items in the Redux state
     */
    constructor (mode, setSelectedItems, clearSelectedItems) {
        this.selectionRect = null;
        this.mode = mode;
        this.setSelectedItems = setSelectedItems;
        this.clearSelectedItems = clearSelectedItems;
    }
    /**
     * @param {boolean} multiselect Whether to multiselect on mouse down (e.g. shift key held)
     */
    onMouseDown (multiselect) {
        if (!multiselect) {
            clearSelection(this.clearSelectedItems);
            this.clearSelectedItems();
        }
    }
    onMouseDrag (event) {
        if (event.event.button > 0) return; // only first mouse button
        this.selectionRect = rectSelect(event);
        // Remove this rect on the next drag and up event
        this.selectionRect.removeOnDrag();
    }
    onMouseUp (event) {
        if (event.event.button > 0) return; // only first mouse button
        if (this.selectionRect) {
            processRectangularSelection(event, this.selectionRect, this.mode);
            this.selectionRect.remove();
            this.selectionRect = null;
            this.setSelectedItems();
        }
    }
}

export default SelectionBoxTool;
