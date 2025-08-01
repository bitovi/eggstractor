import React from 'react';
import { StatusDisplayProps } from '../types';
import { highlightCode } from '../../highlighter';

/**
 * Status display component for warnings, errors, and generated content
 * Uses the existing highlighter for code syntax highlighting
 */
export default function StatusDisplay({
  warnings,
  errors,
  generatedContent,
}: StatusDisplayProps): JSX.Element {
  return (
    <>
      {warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings:</h3>
          {warnings.map((warning, index) => (
            <div key={index} className="warning-item">
              {warning}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="errors">
          <h3>Errors:</h3>
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}

      {generatedContent && (
        <div className="output">
          <pre
            id="output"
            dangerouslySetInnerHTML={{
              __html: highlightCode(generatedContent, 'scss'),
            }}
          />
        </div>
      )}
    </>
  );
}
