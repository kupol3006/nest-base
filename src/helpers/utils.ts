import { genSaltSync, hashSync, compare } from 'bcryptjs';

export const hashPassword = async (plainPassword: string) => {
    try {
        const salt = genSaltSync(10);
        return hashSync(plainPassword, salt);
    } catch (error) {
        throw error;
    }
};

export const comparePassword = async (plainPassword: string, hashedPassword: string) => {
    try {
        return await compare(plainPassword, hashedPassword);
    } catch (error) {
        throw error;
    }
};