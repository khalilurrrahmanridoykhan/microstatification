// Builder.jsx

import {
    DragDropContext,
    Droppable,
    Draggable,
} from "@hello-pangea/dnd";

export default function Builder() {
    const { elements, setElements, selectedElement, setSelectedElement } = useDesigner();

    const handleDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const updated = Array.from(elements);
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        setElements(updated);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="form-elements">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {elements.map((element, index) => (
                            <Draggable
                                key={element.id}
                                draggableId={element.id}
                                index={index}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => setSelectedElement(element)}
                                        className={`border rounded p-4 mb-4 ${selectedElement?.id === element.id ? "ring-2 ring-blue-400" : ""
                                            } ${snapshot.isDragging ? "opacity-50" : ""}`}
                                    >
                                        <element.type.component elementInstance={element} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
