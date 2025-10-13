import { FC } from 'react';

// Figma arrow SVG component
const StepperArrow: FC<{ isActive?: boolean }> = ({ isActive }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="221"
      height="16"
      viewBox="0 0 221 16"
      fill="none"
      className="stepper-arrow-svg"
    >
      <path
        d="M220.707 8.70713C221.098 8.3166 221.098 7.68344 220.707 7.29291L214.343 0.928951C213.953 0.538427 213.319 0.538427 212.929 0.928951C212.538 1.31948 212.538 1.95264 212.929 2.34316L218.586 8.00002L212.929 13.6569C212.538 14.0474 212.538 14.6806 212.929 15.0711C213.319 15.4616 213.953 15.4616 214.343 15.0711L220.707 8.70713ZM0 8L-8.74228e-08 9L220 9.00002L220 8.00002L220 7.00002L8.74228e-08 7L0 8Z"
        fill={isActive ? '#f5532d' : '#BFC5C6'}
      />
    </svg>
  );
};

interface StepperStepProps {
  number: number;
  label: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

const StepperStep: FC<StepperStepProps> = ({
  number,
  label,
  isActive = false,
  isCompleted = false,
}) => {
  return (
    <div className="stepper-step">
      <div
        className={`stepper-step__circle ${isActive || isCompleted ? 'stepper-step__circle--active' : ''}`}
      >
        <span className="stepper-step__number">{number}</span>
      </div>
      <div className="stepper-step__label">
        <span>{label}</span>
      </div>
    </div>
  );
};

interface StepperProps {
  currentStep: number;
  steps: { label: string }[];
}

export const Stepper: FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="stepper">
      {/* Connector with arrows - positioned absolutely behind circles */}
      <div className="stepper-connector">
        {steps.slice(0, -1).map((_, index) => (
          <StepperArrow key={index} isActive={currentStep > index + 1} />
        ))}
      </div>

      {/* Steps - circles and labels */}
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <StepperStep
            key={index}
            number={stepNumber}
            label={step.label}
            isActive={isActive}
            isCompleted={isCompleted}
          />
        );
      })}
    </div>
  );
};
