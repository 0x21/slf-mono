interface IGenerateRandomPasswordParams {
  length?: number;
  allowUpperCaseChars?: boolean;
  allowLowerCaseChars?: boolean;
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
}

export function generateRandomPassword({
  length = 12,
  allowUpperCaseChars = true,
  allowLowerCaseChars = true,
  allowNumbers = true,
  allowSpecialChars = true,
}: IGenerateRandomPasswordParams): string {
  const charSets = {
    upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowerCase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    specialChars: "!@#$%^&*()_+[]{}|;:,.<>?",
  };

  if (
    !allowUpperCaseChars &&
    !allowLowerCaseChars &&
    !allowNumbers &&
    !allowSpecialChars
  ) {
    allowUpperCaseChars = true;
    allowLowerCaseChars = true;
    allowNumbers = true;
    allowSpecialChars = true;
  }

  let availableChars = "";
  if (allowUpperCaseChars) {
    availableChars += charSets.upperCase;
  }
  if (allowLowerCaseChars) {
    availableChars += charSets.lowerCase;
  }
  if (allowNumbers) {
    availableChars += charSets.numbers;
  }
  if (allowSpecialChars) {
    availableChars += charSets.specialChars;
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    password += availableChars[randomIndex];
  }

  return password;
}
