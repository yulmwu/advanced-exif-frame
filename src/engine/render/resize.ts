/**
 * Resize a canvas to a new width and height.
 * @param canvas The canvas to resize.
 * @param width The new width of the canvas.
 * @param height The new height of the canvas.
 * @returns The resized canvas.
 */
export default function resize(canvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
    const resizedCanvas = document.createElement('canvas')
    if (![width, height].every((value) => Number.isFinite(value) && value > 0))
        throw new Error('Invalid resize dimensions')
    resizedCanvas.width = Math.max(1, Math.round(width))
    resizedCanvas.height = Math.max(1, Math.round(height))
    const context = resizedCanvas.getContext('2d')!
    context.imageSmoothingQuality = 'high'
    context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, resizedCanvas.width, resizedCanvas.height)
    return resizedCanvas
}
