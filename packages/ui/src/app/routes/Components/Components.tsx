import { FC, useState } from 'react';
import { LabelLink } from '../../components/LabelLink/LabelLink';
import { ButtonGroup } from '../../components/ButtonGroup';
import './Components.scss';
import { Button, Input } from '../../components';

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
      <div className="form-field">
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
      <div className="form-field">
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
      <div className="form-field">
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
      <div className="form-field">
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
      <div className="form-field">
        <Input label="Input Example" value={inputValue} onChange={setInputValue} />
      </div>
      <div className="form-field">
        <Input
          label="With Hint"
          value={inputValue}
          onChange={setInputValue}
          hint="This is a hint"
        />
      </div>
      <div className="form-field">
        <Input
          label="With Link"
          value={inputValue}
          onChange={setInputValue}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
        />
      </div>
      <div className="form-field">
        <Input
          label="With Link and Hint"
          value={inputValue}
          onChange={setInputValue}
          linkHref="https://bitovi.com"
          linkLabel="Go to Bitovi"
          hint="This is a hint"
        />
      </div>
      <div className="form-field">
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
    </div>
  );
};
