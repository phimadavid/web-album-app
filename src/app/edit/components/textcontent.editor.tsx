import React, { useState, useRef, useEffect } from 'react';

// Type definitions
interface TextAnnotationPosition {
    x: number;
    y: number;
}

interface TextAnnotationStyle {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
}

interface TextAnnotation {
    textContent: string;
    position: TextAnnotationPosition;
    style?: TextAnnotationStyle;
}

interface EditableTextAnnotationProps {
    textAnnotation: TextAnnotation;
    onSave: (updatedAnnotation: TextAnnotation, imageIndex: number) => void;
    imageIndex: number;
}

const EditableTextAnnotation: React.FC<EditableTextAnnotationProps> = ({
    textAnnotation,
    onSave,
    imageIndex
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedText, setEditedText] = useState<string>(textAnnotation?.textContent || '');
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle outside clicks to save changes
    useEffect(() => {
        if (isEditing) {
            const handleClickOutside = (event: MouseEvent) => {
                if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                    handleSave();
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isEditing, editedText]);

    // Focus the input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleDoubleClick = (): void => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEditedText(e.target.value);
    };

    const handleSave = (): void => {
        // Only save if there are actual changes
        if (editedText !== textAnnotation.textContent) {
            const updatedAnnotation: TextAnnotation = {
                ...textAnnotation,
                textContent: editedText
            };

            onSave(updatedAnnotation, imageIndex);
        }

        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            // Cancel editing and revert to original text
            setEditedText(textAnnotation.textContent);
            setIsEditing(false);
        }
    };

    // Common style properties for both display and edit modes
    const commonStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${textAnnotation?.position.x}%`,
        top: `${textAnnotation?.position.y}%`,
        transform: 'translate(-50%, -50%)',
        color: textAnnotation?.style?.color || '#ffffff',
        fontSize: textAnnotation?.style?.fontSize || '24px',
        fontFamily: textAnnotation?.style?.fontFamily || 'Arial, sans-serif',
        fontWeight: textAnnotation?.style?.fontWeight || 'normal',
        textShadow: '0px 0px 4px #000000, 0px 0px 4px #000000',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '4px 8px',
        borderRadius: '4px',
        maxWidth: '80%',
        textAlign: 'center',
        boxShadow: '0 0 8px rgba(0,0,0,0.5)'
    };

    return isEditing ? (
        <div
            className="z-40"
            style={commonStyles}
        >
            <input
                type="text"
                value={editedText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full bg-transparent text-white border-b border-white outline-none text-center"
                style={{
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    textShadow: 'inherit'
                }}
                ref={inputRef}
            />
            <div className="text-xs mt-1 opacity-75">Press Enter to save, Esc to cancel</div>
        </div>
    ) : (
        <div
            className="z-30 cursor-pointer"
            style={commonStyles}
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
        >
            {textAnnotation.textContent}
        </div>
    );
};

export default EditableTextAnnotation;