function useLocalStorage<T>(key: string) {
	function getValue() {
		try {
			if (typeof window === 'undefined' || !window.localStorage) {
				return null;
			}

			const item = window.localStorage.getItem(key);

			if (item === null || item === undefined || item === 'undefined') {
				return null;
			}

			try {
				return JSON.parse(item) as T;
			} catch (parseError) {
				console.error(`Error parsing localStorage item "${key}":`, parseError);
				window.localStorage.removeItem(key);
				return null;
			}
		} catch (error) {
			console.error(`Error accessing localStorage with key "${key}":`, error);
			return null;
		}
	}

	const setValue = (value: T) => {
		try {
			// Si el valor es undefined o null, mejor eliminar la clave
			if (value === undefined || value === null) {
				console.warn(`Setting undefined/null value for "${key}", removing instead`);
				window.localStorage.removeItem(key);
				return;
			}

			const valueToStore = JSON.stringify(value);
			window.localStorage.setItem(key, valueToStore);
		} catch (error) {
			console.error(`Error setting localStorage item "${key}":`, error);
		}
	};

	const removeValue = () => {
		try {
			window.localStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing localStorage item "${key}":`, error);
		}
	};

	let currentValue = null;
	try {
		currentValue = getValue();
	} catch (e) {
		console.error('Error initializing value from localStorage:', e);
	}

	return {
		value: currentValue,
		setValue,
		getValue,
		removeValue
	};
}

export default useLocalStorage;
