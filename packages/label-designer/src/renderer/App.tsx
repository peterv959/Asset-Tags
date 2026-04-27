import React, { useState, useRef } from 'react';

export interface TextElement {
    id: string;
    type: 'text';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    fontSize: number;
    fontFamily: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P';
}

export interface BarcodeElement {
    id: string;
    type: 'barcode';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    barcodeType: 'code128' | 'code39' | 'qrcode';
    humanReadable: boolean;
}

export type LabelElement = TextElement | BarcodeElement;

export interface LabelConfig {
    name: string;
    width: number;
    height: number;
    elements: LabelElement[];
    createdAt?: string;
}

const ZEBRA_FONTS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'] as const;

export function App() {
    const [selectedConfig, setSelectedConfig] = useState<LabelConfig | null>(null);
    const [selectedElement, setSelectedElement] = useState<LabelElement | null>(null);
    const [draggingElement, setDraggingElement] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleNewConfig = () => {
        const newConfig: LabelConfig = {
            name: `Label Design ${new Date().toLocaleTimeString()}`,
            width: 304, // 1.5" at 203 DPI
            height: 102, // 0.5" at 203 DPI
            elements: [],
            createdAt: new Date().toISOString(),
        };
        setSelectedConfig(newConfig);
    };

    const handleAddElement = (type: 'text' | 'barcode') => {
        if (!selectedConfig) return;

        const newElement: LabelElement = type === 'text'
            ? {
                id: `text-${Date.now()}`,
                type: 'text',
                x: 10,
                y: 10,
                width: 100,
                height: 20,
                content: 'New Text',
                fontSize: 12,
                fontFamily: 'A',
            }
            : {
                id: `barcode-${Date.now()}`,
                type: 'barcode',
                x: 10,
                y: 40,
                width: 100,
                height: 50,
                content: '12345',
                barcodeType: 'code128',
                humanReadable: true,
            };

        setSelectedConfig({
            ...selectedConfig,
            elements: [...selectedConfig.elements, newElement],
        });
        setSelectedElement(newElement);
    };

    const handleMouseDown = (elemId: string, e: React.MouseEvent) => {
        e.preventDefault();
        const elem = selectedConfig?.elements.find(el => el.id === elemId);
        if (!elem || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setDraggingElement(elemId);
        setDragOffset({
            x: mouseX - (elem.x / 2), // Canvas is scaled to 50%
            y: mouseY - (elem.y / 2),
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingElement || !selectedConfig || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newX = Math.max(0, Math.min((mouseX - dragOffset.x) * 2, selectedConfig.width - 20));
        const newY = Math.max(0, Math.min((mouseY - dragOffset.y) * 2, selectedConfig.height - 20));

        setSelectedConfig({
            ...selectedConfig,
            elements: selectedConfig.elements.map(elem =>
                elem.id === draggingElement ? { ...elem, x: newX, y: newY } : elem
            ),
        });
    };

    const handleMouseUp = () => {
        setDraggingElement(null);
    };

    const handleUpdateElement = (updates: Partial<LabelElement>) => {
        if (!selectedElement || !selectedConfig) return;

        const updated = { ...selectedElement, ...updates };
        setSelectedElement(updated);
        setSelectedConfig({
            ...selectedConfig,
            elements: selectedConfig.elements.map(elem =>
                elem.id === selectedElement.id ? updated : elem
            ),
        });
    };

    const handleDeleteElement = () => {
        if (!selectedElement || !selectedConfig) return;

        setSelectedConfig({
            ...selectedConfig,
            elements: selectedConfig.elements.filter(elem => elem.id !== selectedElement.id),
        });
        setSelectedElement(null);
    };

    const handleSaveConfig = async () => {
        if (!selectedConfig) return;

        try {
            const result = await window.electronAPI.labelDesigner.saveLabelConfig(selectedConfig);
            if (result && typeof result === 'object' && 'success' in result && result.success) {
                alert('Design saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save design');
        }
    };

    const handleExportConfig = async () => {
        if (!selectedConfig) return;

        const fileName = prompt('Enter file name:', selectedConfig.name);
        if (!fileName) return;

        try {
            const result = await window.electronAPI.labelDesigner.exportLabelConfig(
                selectedConfig,
                fileName
            );
            if (result && typeof result === 'object' && 'success' in result && result.success) {
                alert('Design exported successfully!');
            }
        } catch (error) {
            console.error('Failed to export:', error);
            alert('Failed to export design');
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>DHL Label Designer</h1>
                <p>Design custom label configurations for asset tags</p>
            </header>

            <div className="app-container">
                {!selectedConfig ? (
                    <div className="welcome-screen">
                        <button className="btn btn-primary" onClick={handleNewConfig}>
                            Create New Design
                        </button>
                        <p className="info">Design text fields and barcodes for your labels</p>
                    </div>
                ) : (
                    <div className="editor">
                        <aside className="sidebar">
                            <div className="sidebar-section">
                                <h3>Label Size</h3>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={selectedConfig.name}
                                        onChange={(e) =>
                                            setSelectedConfig({
                                                ...selectedConfig,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Width (dots)</label>
                                    <input
                                        type="number"
                                        min="50"
                                        value={selectedConfig.width}
                                        onChange={(e) =>
                                            setSelectedConfig({
                                                ...selectedConfig,
                                                width: parseInt(e.target.value) || 304,
                                            })
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Height (dots)</label>
                                    <input
                                        type="number"
                                        min="30"
                                        value={selectedConfig.height}
                                        onChange={(e) =>
                                            setSelectedConfig({
                                                ...selectedConfig,
                                                height: parseInt(e.target.value) || 102,
                                            })
                                        }
                                    />
                                </div>
                                <div className="info-text">
                                    (Default: 304×102 = 1.5"×0.5" at 203 DPI)
                                </div>
                            </div>

                            <div className="sidebar-section">
                                <h3>Add Elements</h3>
                                <button className="btn" onClick={() => handleAddElement('text')}>
                                    + Text Field
                                </button>
                                <button className="btn" onClick={() => handleAddElement('barcode')}>
                                    + Barcode
                                </button>
                            </div>

                            {selectedConfig.elements.length > 0 && (
                                <div className="sidebar-section">
                                    <h3>Elements ({selectedConfig.elements.length})</h3>
                                    <div className="elements-list">
                                        {selectedConfig.elements.map((elem) => (
                                            <div
                                                key={elem.id}
                                                className={`element-item ${selectedElement?.id === elem.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedElement(elem)}
                                            >
                                                <span className="element-type">
                                                    {elem.type === 'text' ? '📝' : '📊'}
                                                </span>
                                                <span className="element-content">
                                                    {elem.type === 'text'
                                                        ? (elem as TextElement).content
                                                        : `${(elem as BarcodeElement).barcodeType}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedElement && (
                                <div className="sidebar-section selected-element-props">
                                    <h3>Element Properties</h3>

                                    {selectedElement.type === 'text' && (
                                        <>
                                            <div className="form-group">
                                                <label>Text Content</label>
                                                <input
                                                    type="text"
                                                    value={(selectedElement as TextElement).content}
                                                    onChange={(e) =>
                                                        handleUpdateElement({
                                                            ...selectedElement,
                                                            content: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter text"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Font</label>
                                                <select
                                                    value={(selectedElement as TextElement).fontFamily}
                                                    onChange={(e) =>
                                                        handleUpdateElement({
                                                            ...selectedElement,
                                                            fontFamily: e.target.value as any,
                                                        })
                                                    }
                                                >
                                                    {ZEBRA_FONTS.map((font) => (
                                                        <option key={font} value={font}>
                                                            Font {font}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Font Size</label>
                                                <input
                                                    type="number"
                                                    min="8"
                                                    max="48"
                                                    value={(selectedElement as TextElement).fontSize}
                                                    onChange={(e) =>
                                                        handleUpdateElement({
                                                            ...selectedElement,
                                                            fontSize: parseInt(e.target.value) || 12,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}

                                    {selectedElement.type === 'barcode' && (
                                        <>
                                            <div className="form-group">
                                                <label>Barcode Content</label>
                                                <input
                                                    type="text"
                                                    value={(selectedElement as BarcodeElement).content}
                                                    onChange={(e) =>
                                                        handleUpdateElement({
                                                            ...selectedElement,
                                                            content: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter barcode value"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Barcode Type</label>
                                                <select
                                                    value={(selectedElement as BarcodeElement).barcodeType}
                                                    onChange={(e) =>
                                                        handleUpdateElement({
                                                            ...selectedElement,
                                                            barcodeType: e.target.value as any,
                                                        })
                                                    }
                                                >
                                                    <option value="code128">Code 128</option>
                                                    <option value="code39">Code 39</option>
                                                    <option value="qrcode">QR Code</option>
                                                </select>
                                            </div>

                                            <div className="form-group checkbox">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={(selectedElement as BarcodeElement).humanReadable}
                                                        onChange={(e) =>
                                                            handleUpdateElement({
                                                                ...selectedElement,
                                                                humanReadable: e.target.checked,
                                                            })
                                                        }
                                                    />
                                                    Human Readable
                                                </label>
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group">
                                        <label>Width</label>
                                        <input
                                            type="number"
                                            min="10"
                                            value={selectedElement.width}
                                            onChange={(e) =>
                                                handleUpdateElement({
                                                    ...selectedElement,
                                                    width: parseInt(e.target.value) || 50,
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Height</label>
                                        <input
                                            type="number"
                                            min="10"
                                            value={selectedElement.height}
                                            onChange={(e) =>
                                                handleUpdateElement({
                                                    ...selectedElement,
                                                    height: parseInt(e.target.value) || 50,
                                                })
                                            }
                                        />
                                    </div>

                                    <button className="btn btn-danger" onClick={handleDeleteElement}>
                                        🗑️ Delete Element
                                    </button>
                                </div>
                            )}

                            <div className="sidebar-section">
                                <button className="btn btn-primary" onClick={handleSaveConfig}>
                                    Save Design
                                </button>
                                <button className="btn" onClick={handleExportConfig}>
                                    Export as JSON
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedConfig(null);
                                        setSelectedElement(null);
                                    }}
                                >
                                    New Design
                                </button>
                            </div>
                        </aside>

                        <main
                            className="canvas-area"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div
                                ref={canvasRef}
                                className="canvas"
                                style={{
                                    width: `${selectedConfig.width / 2}px`,
                                    height: `${selectedConfig.height / 2}px`,
                                }}
                            >
                                {selectedConfig.elements.length === 0 && (
                                    <div className="canvas-placeholder">
                                        Add text or barcode elements to get started
                                    </div>
                                )}

                                {selectedConfig.elements.map((elem) => (
                                    <div
                                        key={elem.id}
                                        className={`element ${selectedElement?.id === elem.id ? 'selected' : ''}`}
                                        style={{
                                            left: `${elem.x / 2}px`,
                                            top: `${elem.y / 2}px`,
                                            width: `${elem.width / 2}px`,
                                            height: `${elem.height / 2}px`,
                                        }}
                                        onMouseDown={(e) => handleMouseDown(elem.id, e)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedElement(elem);
                                        }}
                                    >
                                        <span className="element-label">
                                            {elem.type === 'text' ? '📝' : '📊'}
                                            <br />
                                            {elem.type === 'text'
                                                ? (elem as TextElement).content
                                                : (elem as BarcodeElement).barcodeType}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}
