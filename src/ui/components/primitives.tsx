import { useTranslation } from 'react-i18next'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { FiX, FiChevronDown } from 'react-icons/fi'
export function Button({
    children,
    variant = 'secondary',
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
    return (
        <button type="button" {...props} className={`button button-${variant} ${className}`}>
            {children}
        </button>
    )
}
export function IconButton({
    label,
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
    return (
        <button
            type="button"
            {...props}
            aria-label={label}
            title={label}
            className={`icon-button ${props.className ?? ''}`}
        >
            {children}
        </button>
    )
}
export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
    return (
        <label className="field">
            <span className="field-label">{label}</span>
            {children}
            {hint && <span className="field-hint">{hint}</span>}
        </label>
    )
}
export function Toggle({
    label,
    checked,
    onChange,
    disabled,
    hint,
}: {
    label: ReactNode
    checked: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
    hint?: ReactNode
}) {
    return (
        <label className={`toggle-row ${disabled ? 'opacity-45' : ''}`}>
            <span>
                <span className="block">{label}</span>
                {hint && <span className="field-hint">{hint}</span>}
            </span>
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="switch" aria-hidden="true">
                <span />
            </span>
        </label>
    )
}
export function Section({
    title,
    children,
    defaultOpen = true,
    action,
}: {
    title: ReactNode
    children: ReactNode
    defaultOpen?: boolean
    action?: ReactNode
}) {
    return (
        <details className="inspector-section" open={defaultOpen}>
            <summary>
                <span>{title}</span>
                <span className="flex items-center gap-2">
                    {action}
                    <FiChevronDown />
                </span>
            </summary>
            <div className="section-content">{children}</div>
        </details>
    )
}
export function NumberField({
    label,
    value,
    onChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    unit,
    disabled,
}: {
    label: string
    value: number
    onChange: (n: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    disabled?: boolean
}) {
    const input = useRef<HTMLInputElement>(null)
    const formatted = String(Number(value.toFixed(4)))
    const [text, setText] = useState(formatted)
    useEffect(() => {
        if (document.activeElement !== input.current) setText(formatted)
    }, [formatted])
    return (
        <Field label={label}>
            <span className="number-wrap">
                <input
                    type="number"
                    disabled={disabled}
                    ref={input}
                    value={text}
                    min={Number.isFinite(min) ? min : undefined}
                    max={Number.isFinite(max) ? max : undefined}
                    step={step}
                    onChange={(e) => {
                        setText(e.target.value)
                        const n = e.target.valueAsNumber
                        if (Number.isFinite(n) && n >= min && n <= max) onChange(n)
                    }}
                    onBlur={(event) => {
                        const number = event.target.valueAsNumber
                        if (Number.isFinite(number)) {
                            const next = Math.max(min, Math.min(max, number))
                            onChange(next)
                            setText(String(Number(next.toFixed(4))))
                        } else setText(formatted)
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                />
                {unit && <span>{unit}</span>}
            </span>
        </Field>
    )
}
export function Modal({
    title,
    children,
    onClose,
    wide = false,
}: {
    title: string
    children: ReactNode
    onClose: () => void
    wide?: boolean
}) {
    const ref = useRef<HTMLDialogElement>(null)
    const id = useId()
    const { t } = useTranslation()
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null
        ref.current?.showModal()
        return () => {
            previous?.focus()
        }
    }, [])
    return (
        <dialog
            ref={ref}
            aria-labelledby={id}
            className={`modal ${wide ? 'modal-wide' : ''}`}
            onCancel={(e) => {
                e.preventDefault()
                onClose()
            }}
            onClick={(e) => {
                if (e.target === ref.current) onClose()
            }}
        >
            <div className="modal-heading">
                <h2 id={id}>{title}</h2>
                <IconButton label={t('workspace.close')} onClick={onClose}>
                    <FiX />
                </IconButton>
            </div>
            <div className="modal-body">{children}</div>
        </dialog>
    )
}
