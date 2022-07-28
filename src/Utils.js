class Utils {

	static IsLowerCase(ch) {
		return (ch >= 'a') && (ch <= 'z');
	}

	static IsUpperCase(ch) {
		return (ch >= 'A') && (ch <= 'Z');
	}

	static IsFullCase(str) {
		for (let ch in str)
			if (Utils.IsLowerCase(str[ch]))
				return false;
		return true;
	}

}

module.exports = Utils;