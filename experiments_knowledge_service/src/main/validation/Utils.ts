

export class Utils {

    static convertStringToNumber(str): number {

        if (typeof str == 'number') {
            return str;
        }

        if (str == null || str == '') {
            return null;
        }
        return +str;
    }

}