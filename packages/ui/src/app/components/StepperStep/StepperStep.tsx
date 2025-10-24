import { FC } from 'react';
import cn from 'classnames';
import styles from './StepperStep.module.scss';

interface StepperStepProps {
  label?: string;
  step: number;
  status?: 'past' | 'current' | 'future';
  position?: 'first' | 'middle' | 'last';
  onClick?: () => void;
}

export const StepperStep: FC<StepperStepProps> = ({
  label,
  step,
  status = 'current',
  position = 'middle',
  onClick,
}) => {
  const precedingLine = position === 'first';
  const emitLine = position !== 'last';
  const isPast = status === 'past';

  const content = (
    <>
      {precedingLine ? <div className={styles['preceding-line']} /> : null}
      <div className={styles.indicator}>
        <span className={styles.number}>{step}</span>
      </div>
      {emitLine ? (
        <div className={styles['line-container']}>
          <div className={styles.line}>
            <svg
              className={styles['arrow-tip']}
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L7 7L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles['label-wrapper']}>
            <span className={styles.label}>{label}</span>
          </div>
        </div>
      ) : null}
    </>
  );

  const baseClassName = cn(styles['stepper-step'], {
    [styles.past]: status === 'past',
    [styles.current]: status === 'current',
    [styles.future]: status === 'future',
    [styles.first]: position === 'first',
    [styles.middle]: position === 'middle',
    [styles.last]: position === 'last',
  });

  if (isPast && onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClassName}>
        {content}
      </button>
    );
  }

  return <div className={baseClassName}>{content}</div>;
};
