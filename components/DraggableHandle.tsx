import * as React from 'react';

interface DraggableHandleProps {
    onDrag: (movementX: number) => void;
}

const DraggableHandle: React.FC<DraggableHandleProps> = ({ onDrag }) => {
    const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            onDrag(moveEvent.movementX);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
    }, [onDrag]);

    return (
        <div 
            className="w-2 h-full flex items-center justify-center cursor-col-resize group"
            onMouseDown={handleMouseDown}
        >
            <div className="w-0.5 h-1/4 bg-border-light dark:bg-border-dark rounded-full group-hover:bg-primary transition-colors" />
        </div>
    );
};

export default DraggableHandle;