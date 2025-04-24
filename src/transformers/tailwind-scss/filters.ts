import { StyleToken, TokenCollection } from "../../types";

type NonNullableStyleToken = {
  [K in keyof StyleToken]: NonNullable<StyleToken[K]>;
};

export function filterStyleTokens({
  tokens,
}: TokenCollection): NonNullableStyleToken[] {
  return tokens.filter(
    (token): token is NonNullableStyleToken =>
      token.type === "style" &&
      token.value != null &&
      token.value !== "" &&
      token.rawValue != null &&
      token.rawValue !== ""
  );
}
