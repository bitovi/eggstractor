import { FC, useState } from 'react';
import { LabelLink } from '../../components/LabelLink/LabelLink';
import { ButtonGroup } from '../../components/ButtonGroup';
import styles from './Components.module.scss';
import { Button, Input, Card, StepperStep } from '../../components';

export const Components: FC = () => {
  const [activeButton, setActiveButton] = useState('option1');
  const [inputValue, setInputValue] = useState('Input Example');

  return (
    <div className="container">
      <h1>Components</h1>
      <h2>Button</h2>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="icon">i</Button>

      <h2>LabelLink</h2>
      <LabelLink href="https://bitovi.com">Not Bold</LabelLink>
      <LabelLink href="https://bitovi.com" bold>
        Bold
      </LabelLink>
      <h2>ButtonGroup</h2>
      <div className={styles['form-field']}>
        <ButtonGroup<string>
          label="Button Group"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
          ]}
          value={activeButton}
          onChange={setActiveButton}
        />
      </div>
      <div className={styles['form-field']}>
        <ButtonGroup
          label="Button Group With Link"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
          ]}
          value={activeButton}
          onChange={setActiveButton}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
        />
      </div>
      <div className={styles['form-field']}>
        <ButtonGroup
          label="Button Group With Hint"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
          ]}
          value={activeButton}
          onChange={setActiveButton}
          hint="This is a hint"
        />
      </div>
      <div className={styles['form-field']}>
        <ButtonGroup
          label="Button Group With Link and Hint"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
          ]}
          value={activeButton}
          onChange={setActiveButton}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
          hint="This is a hint"
        />
      </div>
      <h2>Input</h2>
      <div className={styles['form-field']}>
        <Input label="Input Example" value={inputValue} onChange={setInputValue} />
      </div>
      <div className={styles['form-field']}>
        <Input
          label="With Hint"
          value={inputValue}
          onChange={setInputValue}
          hint="This is a hint"
        />
      </div>
      <div className={styles['form-field']}>
        <Input
          label="With Link"
          value={inputValue}
          onChange={setInputValue}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
        />
      </div>
      <div className={styles['form-field']}>
        <Input
          label="With Link and Hint"
          value={inputValue}
          onChange={setInputValue}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
          hint="This is a hint"
        />
      </div>
      <div className={styles['form-field']}>
        <Input
          label="With Error"
          value={inputValue}
          onChange={setInputValue}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
          hint="This is a hint"
          error
        />
      </div>

      <h2>Card</h2>
      <div className={styles['form-field']}>
        <Card
          title="Not sure where to start?"
          type="static"
          linkHref="https://bitovi.com"
          linkLabel="View the guide"
        >
          The Getting Started Guide will walk you through the steps for setting up a demo project
          where you can test it all out.
        </Card>
      </div>
      <div className={styles['form-field']}>
        <Card
          title="Not sure where to start?"
          type="expanded"
          linkHref="https://bitovi.com"
          linkLabel="View the guide"
        >
          The Getting Started Guide will walk you through the steps for setting up a demo project
          where you can test it all out.
        </Card>
      </div>
      <div className={styles['form-field']}>
        <Card title="Not sure where to start?" type="collapsed">
          The Getting Started Guide will walk you through the steps for setting up a demo project
          where you can test it all out.
        </Card>
      </div>

      <h2>Stepper Step</h2>
      <div className={styles['form-field']}>
        <StepperStep step={1} label="Label" status="past" />
      </div>
      <div className={styles['form-field']}>
        <StepperStep step={1} label="Label" status="current" />
      </div>
      <div className={styles['form-field']}>
        <StepperStep step={1} label="Label" status="future" />
      </div>
    </div>
  );
};
