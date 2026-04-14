import { hashSync, compareSync } from "bcrypt";
export const Hash = ({ plainText, salt_rounds = 12 }) => {
    return hashSync(plainText, salt_rounds);
};
export const CompareHash = ({ plainText, cipherText }) => {
    return compareSync(plainText, cipherText);
};
