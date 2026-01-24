// src/utils/bancoLookup.ts
// Servicio para identificar bancos españoles por código de entidad del IBAN

interface BancoInfo {
	codigo: string;
	nombre: string;
	nombreCompleto?: string;
}

// Base de datos de códigos de entidad bancaria españoles
const BANCOS_ESPANA: Record<string, BancoInfo> = {
	// Principales bancos
	'2100': { codigo: '2100', nombre: 'CaixaBank', nombreCompleto: 'CaixaBank, S.A.' },
	'0049': { codigo: '0049', nombre: 'Banco Santander', nombreCompleto: 'Banco Santander, S.A.' },
	'0182': { codigo: '0182', nombre: 'BBVA', nombreCompleto: 'Banco Bilbao Vizcaya Argentaria, S.A.' },
	'0081': { codigo: '0081', nombre: 'Banco Sabadell', nombreCompleto: 'Banco de Sabadell, S.A.' },
	'0128': { codigo: '0128', nombre: 'Bankinter', nombreCompleto: 'Bankinter, S.A.' },
	'0030': { codigo: '0030', nombre: 'Banco Español de Crédito', nombreCompleto: 'Banco Español de Crédito, S.A.' },
	'0075': { codigo: '0075', nombre: 'Banco Popular', nombreCompleto: 'Banco Popular Español, S.A.' },
	'0086': { codigo: '0086', nombre: 'Banco Alcalá', nombreCompleto: 'Banco Alcalá, S.A.' },

	// Cajas de ahorros principales
	'3025': { codigo: '3025', nombre: 'Caixa Ontinyent', nombreCompleto: 'Caja de Ahorros de Ontinyent' },
	'3058': { codigo: '3058', nombre: 'Cajamar', nombreCompleto: 'Cajamar Caja Rural, S.C.C.' },
	'3076': { codigo: '3076', nombre: 'Caja Rural del Sur', nombreCompleto: 'Caja Rural del Sur, S.C.C.' },
	'3081': { codigo: '3081', nombre: 'Caja Rural de Navarra', nombreCompleto: 'Caja Rural de Navarra, S.C.C.' },
	'3089': { codigo: '3089', nombre: 'Caja Rural de Asturias', nombreCompleto: 'Caja Rural de Asturias, S.C.C.' },
	'3095': {
		codigo: '3095',
		nombre: 'Caja Rural de Almendralejo',
		nombreCompleto: 'Caja Rural San José de Almendralejo, S.C.C.'
	},

	// Bancos digitales y fintech
	'0238': { codigo: '0238', nombre: 'Banco Mediolanum', nombreCompleto: 'Banco Mediolanum, S.A.' },
	'0239': { codigo: '0239', nombre: 'EVO Banco', nombreCompleto: 'EVO Banco, S.A.' },
	'0232': { codigo: '0232', nombre: 'Inversis Banco', nombreCompleto: 'Inversis Banco, S.A.' },

	// Bancos extranjeros con presencia en España
	'0136': { codigo: '0136', nombre: 'ING', nombreCompleto: 'ING Bank N.V., Sucursal en España' },
	'0122': { codigo: '0122', nombre: 'Citibank', nombreCompleto: 'Citibank España, S.A.' },
	'0152': { codigo: '0152', nombre: 'Barclays', nombreCompleto: 'Barclays Bank PLC' },
	'0073': { codigo: '0073', nombre: 'OpenBank', nombreCompleto: 'Openbank, S.A.' },
	'6714': { codigo: '6714', nombre: 'Revolut Bank', nombreCompleto: 'Revolut Bank UAB, Sucursal en España' },

	// Cooperativas de crédito principales
	'3007': { codigo: '3007', nombre: 'Caja Rural de Aragón', nombreCompleto: 'Caja Rural de Aragón, S.C.C.' },
	'3008': {
		codigo: '3008',
		nombre: 'Caja Rural de Albacete',
		nombreCompleto: 'Caja Rural de Albacete, Ciudad Real y Cuenca, S.C.C.'
	},
	'3017': {
		codigo: '3017',
		nombre: 'Caja Rural de Castilla-La Mancha',
		nombreCompleto: 'Caja Rural de Castilla-La Mancha, S.C.C.'
	},
	'3023': { codigo: '3023', nombre: 'Caja Rural de Torrent', nombreCompleto: 'Caja Rural de Torrent, S.C.C.' },
	'3045': { codigo: '3045', nombre: 'Caja Rural Central', nombreCompleto: 'Caja Rural Central, S.C.C.' },

	// Otros bancos importantes
	'0019': { codigo: '0019', nombre: 'Deutsche Bank', nombreCompleto: 'Deutsche Bank, S.A.E.' },
	'0061': { codigo: '0061', nombre: 'Banca March', nombreCompleto: 'Banca March, S.A.' },
	'0087': {
		codigo: '0087',
		nombre: 'Banco de Caja España',
		nombreCompleto: 'Banco de Caja España de Inversiones, Salamanca y Soria, S.A.'
	},
	'0131': { codigo: '0131', nombre: 'Banco Caixa Geral', nombreCompleto: 'Banco Caixa Geral, S.A.' },
	'0224': { codigo: '0224', nombre: 'Banco Pichincha', nombreCompleto: 'Banco Pichincha España, S.A.' },

	// Entidades de crédito especializadas
	'0186': { codigo: '0186', nombre: 'Banco Mediocrédito', nombreCompleto: 'Banco Mediocrédito, S.A.' },
	'0487': { codigo: '0487', nombre: 'Banco Mare Nostrum', nombreCompleto: 'Banco Mare Nostrum, S.A.' },
	'3140': {
		codigo: '3140',
		nombre: 'Caja Rural de Villafranca',
		nombreCompleto: 'Caja Rural San Roque de Villafranca, S.C.C.'
	},

	// Bancos de inversión
	'0187': { codigo: '0187', nombre: 'Banco Cooperativo Español', nombreCompleto: 'Banco Cooperativo Español, S.A.' },
	'0216': { codigo: '0216', nombre: 'Banco de Depósitos', nombreCompleto: 'Banco de Depósitos, S.A.' }

	// Añadir más según necesidades...
};

/**
 * Extrae el código de entidad bancaria del IBAN español
 * @param iban - IBAN completo (con o sin espacios)
 * @returns Código de entidad de 4 dígitos o null si no es válido
 */
export function extraerCodigoEntidad(iban: string): string | null {
	// Limpiar espacios y convertir a mayúsculas
	const ibanLimpio = iban.replace(/\s/g, '').toUpperCase();

	// Verificar que sea un IBAN español válido (formato básico)
	if (!ibanLimpio.match(/^ES\d{22}$/)) {
		return null;
	}

	// Extraer código de entidad (posiciones 4-7, después de ES + 2 dígitos de control)
	return ibanLimpio.substring(4, 8);
}

/**
 * Obtiene información del banco basándose en el IBAN
 * @param iban - IBAN completo
 * @returns Información del banco o null si no se encuentra
 */
export function obtenerBancoPorIban(iban: string): BancoInfo | null {
	const codigoEntidad = extraerCodigoEntidad(iban);

	if (!codigoEntidad) {
		return null;
	}

	return BANCOS_ESPANA[codigoEntidad] || null;
}

/**
 * Valida si un IBAN español tiene el formato correcto
 * @param iban - IBAN a validar
 * @returns true si el formato es válido
 */
export function validarFormatoIbanEspanol(iban: string): boolean {
	const ibanLimpio = iban.replace(/\s/g, '').toUpperCase();
	return /^ES\d{22}$/.test(ibanLimpio);
}

/**
 * Formatea un IBAN para mostrarlo con espacios
 * @param iban - IBAN sin formato
 * @returns IBAN formateado con espacios cada 4 caracteres
 */
export function formatearIban(iban: string): string {
	const ibanLimpio = iban.replace(/\s/g, '').toUpperCase();

	if (!validarFormatoIbanEspanol(ibanLimpio)) {
		return iban; // Devolver tal como está si no es válido
	}

	// Formatear con espacios cada 4 caracteres
	return ibanLimpio.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Obtiene todos los bancos disponibles en la base de datos
 * @returns Array con todos los bancos
 */
export function obtenerTodosBancos(): BancoInfo[] {
	return Object.values(BANCOS_ESPANA).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Busca bancos por nombre (para autocompletado)
 * @param termino - Término de búsqueda
 * @returns Array de bancos que coinciden con la búsqueda
 */
export function buscarBancosPorNombre(termino: string): BancoInfo[] {
	const terminoLimpio = termino.toLowerCase();

	return Object.values(BANCOS_ESPANA)
		.filter(
			(banco) =>
				banco.nombre.toLowerCase().includes(terminoLimpio) ||
				(banco.nombreCompleto && banco.nombreCompleto.toLowerCase().includes(terminoLimpio))
		)
		.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * Valida el formato de un Creditor ID SEPA español
 * Formato: ESxxZZZxxxxxxxx (donde xx son dígitos de control, ZZZ es el sufijo, y xxxxxxxx es el NIF/CIF)
 * @param creditorId - Creditor ID a validar
 * @returns true si el formato es válido
 */
export function validarCreditorId(creditorId: string): boolean {
	if (!creditorId) return false;

	const creditorIdLimpio = creditorId.replace(/\s/g, '').toUpperCase();

	// Formato: ES + 2 dígitos control + 3 caracteres sufijo + 8-9 caracteres NIF/CIF
	return /^ES\d{2}[A-Z0-9]{3}[A-Z0-9]{8,9}$/.test(creditorIdLimpio);
}

/**
 * Formatea un Creditor ID para mostrarlo
 * @param creditorId - Creditor ID sin formato
 * @returns Creditor ID formateado
 */
export function formatearCreditorId(creditorId: string): string {
	if (!creditorId) return '';

	const creditorIdLimpio = creditorId.replace(/\s/g, '').toUpperCase();

	if (!validarCreditorId(creditorIdLimpio)) {
		return creditorId;
	}

	// Formato: ES12 ZZZ 12345678X
	return `${creditorIdLimpio.slice(0, 4)} ${creditorIdLimpio.slice(4, 7)} ${creditorIdLimpio.slice(7)}`;
}

/**
 * Valida el formato de un código BIC/SWIFT
 * Formato: 8 u 11 caracteres alfanuméricos
 * @param bic - Código BIC a validar
 * @returns true si el formato es válido
 */
export function validarBic(bic: string): boolean {
	if (!bic) return true; // BIC es opcional

	const bicLimpio = bic.replace(/\s/g, '').toUpperCase();

	// Formato: 4 letras (banco) + 2 letras (país) + 2 alfanuméricos (localidad) + 3 opcionales (sucursal)
	return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bicLimpio);
}

/**
 * Formatea un código BIC para mostrarlo
 * @param bic - Código BIC sin formato
 * @returns Código BIC formateado en mayúsculas
 */
export function formatearBic(bic: string): string {
	if (!bic) return '';

	return bic.replace(/\s/g, '').toUpperCase();
}
