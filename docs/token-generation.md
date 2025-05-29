<!--@@joggrdoc@@-->
<!-- @joggr:version(v2):end -->
<!-- @joggr:warning:start -->
<!-- 
  _   _   _    __        __     _      ____    _   _   ___   _   _    ____     _   _   _ 
 | | | | | |   \ \      / /    / \    |  _ \  | \ | | |_ _| | \ | |  / ___|   | | | | | |
 | | | | | |    \ \ /\ / /    / _ \   | |_) | |  \| |  | |  |  \| | | |  _    | | | | | |
 |_| |_| |_|     \ V  V /    / ___ \  |  _ <  | |\  |  | |  | |\  | | |_| |   |_| |_| |_|
 (_) (_) (_)      \_/\_/    /_/   \_\ |_| \_\ |_| \_| |___| |_| \_|  \____|   (_) (_) (_)
                                                              
This document is managed by Joggr. Editing this document could break Joggr's core features, i.e. our 
ability to auto-maintain this document. Please use the Joggr editor to edit this document 
(link at bottom of the page).
-->
<!-- @joggr:warning:end -->
## Getting Started

### Step 1: Initialize Token Collection

The function begins by preparing to collect tokens and track variable tokens for the node.

```typescript
const tokens: (StyleToken | VariableToken)[] = [];
const variableTokensMap = new Map<string, VariableToken>();
```

### Step 2: Define Variable Token Helper

A helper function, `getOrCreateVariableToken`, is defined to ensure each variable token (by variable ID and property) is only created once. It uses `collectBoundVariable` to fetch or create a VariableToken.

```typescript
const getOrCreateVariableToken = async (varId: string, property: string) => {
  const key = `${varId}-${property}`;
  if (variableTokensMap.has(key)) {
    return variableTokensMap.get(key)!;
  }
  const token = await collectBoundVariable(varId, property, path, node);
  if (token) {
    variableTokensMap.set(key, token);
    tokens.push(token);
  }
  return token;
};
```

### Step 3: Handle Custom Variable Bindings

If the processor specifies a `bindingKey`, the function extracts custom variable bindings from the node and ensures a VariableToken exists for each.

```typescript
const customBoundVariables = node.boundVariables as unknown as VariableBindings;
const bindings = processor.bindingKey
  ? Array.isArray(customBoundVariables[processor.bindingKey])
    ? (customBoundVariables[processor.bindingKey] as VariableAlias[])
    : ([customBoundVariables[processor.bindingKey]] as VariableAlias[])
  : [];

for (const binding of bindings) {
  if (binding?.id) {
    await getOrCreateVariableToken(binding.id, processor.property);
  }
}
```

### Step 4: Collect All Bound Variables

The function iterates over all entries in `node.boundVariables`, collecting variable tokens for each variable alias found.

```typescript
if ('boundVariables' in node && node.boundVariables) {
  for (const [key, value] of Object.entries(node.boundVariables)) {
    if (typeof key === 'string' && value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v.type === 'VARIABLE_ALIAS') {
            await getOrCreateVariableToken(v.id, key);
          }
        }
      } else if (value?.type === 'VARIABLE_ALIAS') {
        await getOrCreateVariableToken(String(value.id), key);
      }
    }
  }
}
```

### Step 5: Process Node and Create StyleToken

The processor's `process` method is called with the collected variable tokens and the node. If a value is returned, a StyleToken is constructed and added to the tokens array.

```typescript
const processedValue = await processor.process([...variableTokensMap.values()], node);
if (processedValue) {
  const styleToken: StyleToken = {
    type: 'style',
    name: path.join('_'),
    value: processedValue.value,
    rawValue: processedValue.rawValue,
    valueType: processedValue.valueType,
    property: processor.property,
    path,
    variables: variableTokensMap.size > 0 ? [...variableTokensMap.values()] : undefined,
    metadata: {
      figmaId: node.id,
    },
    warnings: processedValue.warnings,
    errors: processedValue.errors,
  };
  tokens.push(styleToken);
}
```

## 🎉 Done

You now understand how `extractNodeToken` transforms a Figma SceneNode into a StyleToken, capturing both style and variable references for use in design token pipelines.

## Troubleshooting

* If no tokens are returned, ensure the node has the expected bound variables and the processor is correctly implemented.

* If variable tokens are missing, check the structure of `boundVariables` on the node.

## Resources

* [eggstractor GitHub Repository](https://github.com/bitovi/eggstractor)

* [Figma Plugin API Reference](https://www.figma.com/plugin-docs/api/)

<!-- @joggr:editLink(51ea619c-a68f-47aa-a1c1-892466563358):start -->
---
<a href="https://app.joggr.io/app/documents/51ea619c-a68f-47aa-a1c1-892466563358/edit">
  <img src="https://cdn.joggr.io/assets/static/badges/joggr-document-edit.svg?did=51ea619c-a68f-47aa-a1c1-892466563358" alt="Edit doc on Joggr" />
</a>
<!-- @joggr:editLink(51ea619c-a68f-47aa-a1c1-892466563358):end -->
