var React = require('react');
var _     = require('underscore');

var PT    = React.PropTypes;

var sortableDragging = {
    cursor: "ns-resize"
};

var sortableEnabled = {
    cursor: "pointer"
};

var userSelect = function(rhs)  {
    return {
        "-webkit-user-select": rhs,
        "-khtml-user-drag": rhs,
        "-khtml-user-select": rhs,
        "-moz-user-select": rhs,
        "-ms-user-select": rhs,
        userSelect: rhs
    };
};

var sortableDisabled = userSelect("none");

// Takes an array of components to sort
var SortableArea = React.createClass({displayName: 'SortableArea',
    propTypes: {
        components: PT.arrayOf(PT.node).isRequired,
        onReorder: PT.func.isRequired,
        verify: PT.func
    },
    render: function() {
        var sortables = _(this.state.components).filter(function(component){
                            return (component);
                        });
        sortables = _(sortables).map(function(component, index)
            {
                return React.createElement(SortableItem, {
                index: index,
                component: component,
                area: this,
                key: ['Sortable',component.key].join(''),
                draggable: component.props.draggable,
                dragging: index === this.state.dragging});

            }.bind(this)
        );
        return React.createElement("ol", {className: this.props.className, style: this.props.style},
            sortables
        );
    },
    getDefaultProps: function() {
        return { verify: function()  {return true;} };
    },
    getInitialState: function() {
        return {
            // index of the component being dragged
            dragging: null,
            components: this.props.components
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ components: nextProps.components });
    },
    // Alternatively send each handler to each component individually,
    // partially applied
    onDragStart: function(startIndex) {
        this.setState({ dragging: startIndex });
    },
    onDrop: function(event) {
        // tell the parent component
        this.setState({ dragging: null });
        this.props.onReorder(event,this.state.components);
    },
    onDragEnter: function(enterIndex) {
        // When a label is first dragged it triggers a dragEnter with itself,
        // which we don't care about.
        if (this.state.dragging === enterIndex) {
            return;
        }

        var newComponents = this.state.components.slice();

        // splice the tab out of its old position
        var removed = newComponents.splice(this.state.dragging, 1);
        // ... and into its new position
        newComponents.splice(enterIndex, 0, removed[0]);

        var verified = this.props.verify(newComponents);
        if (verified) {
            this.setState({
                dragging: enterIndex,
                components: newComponents
            });
        }
        return verified;
    },

    // Firefox refuses to drag an element unless you set data on it. Hackily
    // add data each time an item is dragged.
    componentDidMount: function() {
        this._setDragEvents();
    },
    componentDidUpdate: function() {
        this._setDragEvents();
    },
    _listenEvent: function(e) {
        e.dataTransfer.setData('hackhackhack', 'because browsers!');
    },
    _cancelEvent: function(e) {
        // prevent the browser from redirecting to 'because browsers!'
        //e.dataTransfer.setData('EVENTOOOOOOOOO', e);
        e.preventDefault();
    },
    _setDragEvents: function() {
        this._dragItems = this._dragItems || [];
        var items = this.getDOMNode().querySelectorAll('[draggable=true]');
        var oldItems = _(this._dragItems).difference(items);
        var newItems = _(items).difference(this._dragItems);

        _(newItems).each(function(dragItem)  {
            dragItem.addEventListener('dragstart', this._listenEvent);
            dragItem.addEventListener('drop',      this._cancelEvent);
        }.bind(this));

        _(oldItems).each(function(dragItem)  {
            dragItem.removeEventListener('dragstart', this._listenEvent);
            dragItem.removeEventListener('drop',      this._cancelEvent);
        }.bind(this));
    }
});

// An individual sortable item
var SortableItem = React.createClass({displayName: 'SortableItem',
    propTypes: {
        // item: what is this?
    },
    render: function() {
        var dragState = "sortable-disabled";
        if (this.props.dragging) {
            dragState = "sortable-dragging";
        } else if (this.props.draggable) {
            dragState = "sortable-enabled";
        }

        return React.createElement("li", {draggable: this.props.draggable,
                className: dragState,
                onDragStart: this.handleDragStart,
                onDrop: this.handleDrop,
                onDragEnter: this.handleDragEnter,
                onDragOver: this.handleDragOver},
            this.props.component
        );
    },
    handleDragStart: function(e) {
        e.nativeEvent.dataTransfer.effectAllowed = "move";
        e.nativeEvent.dataTransfer.item_index = this.props.index;

        this.props.area.onDragStart(this.props.index);
    },
    handleDrop: function(e) {
        e.nativeEvent.dataTransfer.item = "handleDrop";
        this.props.area.onDrop(this.props.index);
    },
    handleDragEnter: function(e) {
        var verified = this.props.area.onDragEnter(this.props.index);
        // Ideally this would change the cursor based on whether this is a
        // valid place to drop.
        e.nativeEvent.dataTransfer.item = "handleDragEnter";
        e.nativeEvent.dataTransfer.effectAllowed = verified ? "move" : "none";
    },
    handleDragOver: function(e) {
        // allow a drop by preventing default handling
        e.preventDefault();
    }
});

module.exports = SortableArea;