import { FC } from 'react';

interface SegmentedButtonOption {
  value: string;
  label: string;
}

interface SegmentedButtonProps {
  options: SegmentedButtonOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export const SegmentedButton: FC<SegmentedButtonProps> = ({
  options,
  value,
  onChange,
  label,
  hint,
  className = '',
}) => {
  return (
    <div className={`segmented-button ${className}`}>
      {label && (
        <div className="segmented-button__header">
          <label className="segmented-button__label">{label}</label>
        </div>
      )}
      <div className="segmented-button__container">
        <div className="segmented-button__options">
          {options.map((option) => (
            <div key={option.value} className="segmented-button__item">
              <button
                type="button"
                className={`segmented-button__button ${
                  value === option.value
                    ? 'segmented-button__button--selected'
                    : 'segmented-button__button--unselected'
                }`}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            </div>
          ))}
        </div>
      </div>
      {hint && <p className="segmented-button__hint">{hint}</p>}
    </div>
  );
};
