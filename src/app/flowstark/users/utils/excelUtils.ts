// src/app/flowstark/users/utils/excelUtils.ts
import * as XLSX from 'xlsx';
import { Client } from '../../../../types/models';

// Definición de las columnas del Excel
export const EXCEL_COLUMNS = [
  { header: 'Nombre*', key: 'firstName', width: 15 },
  { header: 'Apellidos*', key: 'lastName', width: 20 },
  { header: 'Razón Social', key: 'fiscalName', width: 25 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Teléfono', key: 'phone', width: 15 },
  { header: 'DNI/NIF', key: 'idNumber', width: 15 },
  { header: 'CIF', key: 'taxId', width: 15 },
  { header: 'Dirección', key: 'address', width: 30 },
  { header: 'Ciudad', key: 'city', width: 20 },
  { header: 'Código Postal', key: 'postalCode', width: 12 },
  { header: 'País', key: 'country', width: 15 },
  { header: 'IBAN', key: 'iban', width: 25 },
  { header: 'Banco', key: 'bank', width: 20 },
  { header: 'Notas', key: 'notes', width: 30 },
];

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  valid: boolean;
  clients: Partial<Client>[];
  errors: ImportValidationError[];
}

/**
 * Genera un archivo Excel con la plantilla para importar clientes
 */
export const generateTemplateExcel = (): void => {
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Crear datos de ejemplo
  const exampleData = [
    {
      'Nombre*': 'Juan',
      'Apellidos*': 'García Pérez',
      'Razón Social': 'Juan García García SL',
      'Email': 'juan.garcia@example.com',
      'Teléfono': '600123456',
      'DNI/NIF': '12345678A',
      'CIF': 'B12345678',
      'Dirección': 'Calle Mayor 123',
      'Ciudad': 'Madrid',
      'Código Postal': '28001',
      'País': 'España',
      'IBAN': 'ES7921000813610123456789',
      'Banco': 'Banco Santander',
      'Notas': 'Cliente VIP',
    },
  ];

  // Crear hoja de trabajo con los datos de ejemplo
  const worksheet = XLSX.utils.json_to_sheet(exampleData);

  // Establecer ancho de columnas
  worksheet['!cols'] = EXCEL_COLUMNS.map(col => ({ wch: col.width }));

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  // Crear hoja de instrucciones
  const instructions = [
    ['INSTRUCCIONES PARA IMPORTAR CLIENTES'],
    [''],
    ['1. Los campos marcados con * son obligatorios (Nombre y Apellidos)'],
    ['2. Complete los datos de sus clientes en las filas siguientes'],
    ['3. Puede eliminar la fila de ejemplo si lo desea'],
    ['4. No modifique los nombres de las columnas'],
    ['5. Guarde el archivo y súbalo en la plataforma'],
    [''],
    ['FORMATOS DE DATOS:'],
    ['- Email: debe ser un correo electrónico válido'],
    ['- Teléfono: números sin espacios (ej: 600123456)'],
    ['- IBAN: formato español (ES + 22 dígitos)'],
    ['- Código Postal: 5 dígitos'],
    [''],
    ['NOTAS:'],
    ['- Todos los clientes importados se crearán como activos'],
    ['- La fecha de registro será la fecha de importación'],
    ['- El método de pago por defecto será transferencia bancaria'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

  // Descargar el archivo
  XLSX.writeFile(workbook, 'plantilla_importar_clientes.xlsx');
};

/**
 * Valida un email
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida y parsea los datos del Excel importado
 */
export const parseAndValidateExcel = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          resolve({
            valid: false,
            clients: [],
            errors: [{ row: 0, field: 'general', message: 'El archivo está vacío o no contiene datos válidos' }],
          });
          return;
        }

        const clients: Partial<Client>[] = [];
        const errors: ImportValidationError[] = [];

        // Validar cada fila
        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // +2 porque Excel empieza en 1 y tiene cabecera
          const rowErrors: ImportValidationError[] = [];

          // Validar campos obligatorios
          if (!row['Nombre*'] || row['Nombre*'].toString().trim() === '') {
            rowErrors.push({
              row: rowNumber,
              field: 'Nombre',
              message: 'El campo Nombre es obligatorio',
            });
          }

          if (!row['Apellidos*'] || row['Apellidos*'].toString().trim() === '') {
            rowErrors.push({
              row: rowNumber,
              field: 'Apellidos',
              message: 'El campo Apellidos es obligatorio',
            });
          }

          // Validar email si está presente
          if (row['Email'] && row['Email'].toString().trim() !== '') {
            if (!isValidEmail(row['Email'].toString().trim())) {
              rowErrors.push({
                row: rowNumber,
                field: 'Email',
                message: 'El formato del email no es válido',
              });
            }
          }

          // Si hay errores en esta fila, añadirlos a la lista
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            // Si no hay errores, crear el objeto cliente
            const client: Partial<Client> = {
              firstName: row['Nombre*']?.toString().trim() || '',
              lastName: row['Apellidos*']?.toString().trim() || '',
              fiscalName: row['Razón Social']?.toString().trim() || '',
              email: row['Email']?.toString().trim() || '',
              phone: row['Teléfono']?.toString().trim() || '',
              idNumber: row['DNI/NIF']?.toString().trim() || '',
              taxId: row['CIF']?.toString().trim() || '',
              address: row['Dirección']?.toString().trim() || '',
              city: row['Ciudad']?.toString().trim() || '',
              postalCode: row['Código Postal']?.toString().trim() || '',
              country: row['País']?.toString().trim() || 'España',
              iban: row['IBAN']?.toString().trim() || '',
              bank: row['Banco']?.toString().trim() || '',
              notes: row['Notas']?.toString().trim() || '',
              paymentMethod: {
                type: 'transfer',
                details: {},
              },
            };

            clients.push(client);
          }
        });

        resolve({
          valid: errors.length === 0,
          clients,
          errors,
        });
      } catch (error) {
        reject(new Error('Error al procesar el archivo Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsBinaryString(file);
  });
};
