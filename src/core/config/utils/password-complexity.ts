
export const checkPasswordComplexity = async (password: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        try {
            if (password.length >= 20) {
                resolve(true);
            }

            const regex = /^(?!.*(?:qwert|asdf|1234))(?=.*[-!"#$%&()*+,./:;?@\[\]^_`{|}~+><=])(?=[A-Za-z0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
            let result = regex.test(password);
            if (result) {
                resolve(true);
            }
            else {
                resolve(false);
            }
           

        } catch (err) {
            reject(err);
        }
    });
}