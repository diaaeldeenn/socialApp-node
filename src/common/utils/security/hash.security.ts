import { hashSync, compareSync } from "bcrypt";

export const Hash = ({ plainText, salt_rounds = 12 } : {plainText:string,salt_rounds?:number}) => {
  return hashSync(plainText, salt_rounds);
};

export const CompareHash = ({ plainText, cipherText } : {plainText:string,cipherText:string}) => {
  return compareSync(plainText, cipherText);
};
