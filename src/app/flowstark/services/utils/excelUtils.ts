// src/app/flowstark/services/utils/excelUtils.ts
import * as XLSX from 'xlsx';
import { Service } from '../../../../types/models';

// Definición de las columnas del Excel
export const EXCEL_COLUMNS = [
  { header: 'Nombre*', key: 'name', width: 25 },
  { header: 'Descripción*', key: 'description', width: 40 },
  { header: 'Precio Base*', key: 'basePrice', width: 15 },
  { header: 'IVA (%)*', key: 'vat', width: 12 },
  { header: 'Retención (%)', key: 'retention', width: 15 },
  { header: 'Frecuencia*', key: 'frequency', width: 20 },
  { header: 'Renovación*', key: 'renovation', width: 20 },
];

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  valid: boolean;
  services: Partial<Service>[];
  errors: ImportValidationError[];
}

/**
 * Genera un archivo Excel con la plantilla para importar servicios
 */
export const generateTemplateExcel = (): void => {
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Crear datos de ejemplo
  const exampleData = [
    {
      'Nombre*': 'Asesoría Fiscal Mensual',
      'Descripción*': 'Servicio de asesoría fiscal y contable mensual',
      'Precio Base*': 150.00,
      'IVA (%)*': 21,
      'Retención (%)': 15,
      'Frecuencia*': 'monthly',
      'Renovación*': 'first_day',
    },
    {
      'Nombre*': 'Declaración Trimestral',
      'Descripción*': 'Gestión y presentación de declaraciones trimestrales',
      'Precio Base*': 350.00,
      'IVA (%)*': 21,
      'Retención (%)': 15,
      'Frecuencia*': 'quarterly',
      'Renovación*': 'last_day',
    },
  ];

  // Crear hoja de trabajo con los datos de ejemplo
  const worksheet = XLSX.utils.json_to_sheet(exampleData);

  // Establecer ancho de columnas
  worksheet['!cols'] = EXCEL_COLUMNS.map(col => ({ wch: col.width }));

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Servicios');

  // Crear hoja de instrucciones
  const instructions = [
    ['INSTRUCCIONES PARA IMPORTAR SERVICIOS'],
    [''],
    ['1. Los campos marcados con * son obligatorios'],
    ['2. Complete los datos de sus servicios en las filas siguientes'],
    ['3. Puede eliminar las filas de ejemplo si lo desea'],
    ['4. No modifique los nombres de las columnas'],
    ['5. Guarde el archivo y súbalo en la plataforma'],
    [''],
    ['FORMATOS DE DATOS:'],
    ['- Precio Base: número decimal (ej: 150.00 o 150)'],
    ['- IVA (%): número entre 0 y 100 (ej: 21 para 21%)'],
    ['- Retención (%): número entre 0 y 100 (ej: 15 para 15%), opcional'],
    [''],
    ['VALORES VÁLIDOS PARA FRECUENCIA:'],
    ['- monthly: Mensual'],
    ['- quarterly: Trimestral'],
    ['- four_monthly: Cuatrimestral'],
    ['- biannual: Semestral'],
    ['- annual: Anual'],
    [''],
    ['VALORES VÁLIDOS PARA RENOVACIÓN:'],
    ['- first_day: Primer día del período'],
    ['- last_day: Último día del período'],
    [''],
    ['NOTAS:'],
    ['- Todos los servicios importados se crearán como activos'],
    ['- El precio final se calculará automáticamente aplicando IVA y retención'],
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');

  // Descargar el archivo
  XLSX.writeFile(workbook, 'plantilla_importar_servicios.xlsx');
};

/**
 * Valida un número
 */
const isValidNumber = (value: any): boolean => {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

/**
 * Valida la frecuencia
 */
const isValidFrequency = (frequency: string): frequency is Service['frequency'] => {
  const validFrequencies = ['monthly', 'quarterly', 'four_monthly', 'biannual', 'annual'];
  return validFrequencies.includes(frequency);
};

/**
 * Valida la renovación
 */
const isValidRenovation = (renovation: string): renovation is Service['renovation'] => {
  const validRenovations = ['first_day', 'last_day'];
  return validRenovations.includes(renovation);
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
            services: [],
            errors: [{ row: 0, field: 'general', message: 'El archivo está vacío o no contiene datos válidos' }],
          });
          return;
        }

        const services: Partial<Service>[] = [];
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

          if (!row['Descripción*'] || row['Descripción*'].toString().trim() === '') {
            rowErrors.push({
              row: rowNumber,
              field: 'Descripción',
              message: 'El campo Descripción es obligatorio',
            });
          }

          // Validar Precio Base
          if (!isValidNumber(row['Precio Base*'])) {
            rowErrors.push({
              row: rowNumber,
              field: 'Precio Base',
              message: 'El Precio Base debe ser un número válido',
            });
          } else if (Number(row['Precio Base*']) < 0) {
            rowErrors.push({
              row: rowNumber,
              field: 'Precio Base',
              message: 'El Precio Base no puede ser negativo',
            });
          }

          // Validar IVA
          if (!isValidNumber(row['IVA (%)*'])) {
            rowErrors.push({
              row: rowNumber,
              field: 'IVA',
              message: 'El IVA debe ser un número válido',
            });
          } else {
            const vat = Number(row['IVA (%)*']);
            if (vat < 0 || vat > 100) {
              rowErrors.push({
                row: rowNumber,
                field: 'IVA',
                message: 'El IVA debe estar entre 0 y 100',
              });
            }
          }

          // Validar Retención (opcional)
          if (row['Retención (%)'] && row['Retención (%)'].toString().trim() !== '') {
            if (!isValidNumber(row['Retención (%)'])) {
              rowErrors.push({
                row: rowNumber,
                field: 'Retención',
                message: 'La Retención debe ser un número válido',
              });
            } else {
              const retention = Number(row['Retención (%)']);
              if (retention < 0 || retention > 100) {
                rowErrors.push({
                  row: rowNumber,
                  field: 'Retención',
                  message: 'La Retención debe estar entre 0 y 100',
                });
              }
            }
          }

          // Validar Frecuencia
          if (!row['Frecuencia*'] || row['Frecuencia*'].toString().trim() === '') {
            rowErrors.push({
              row: rowNumber,
              field: 'Frecuencia',
              message: 'El campo Frecuencia es obligatorio',
            });
          } else if (!isValidFrequency(row['Frecuencia*'].toString().trim())) {
            rowErrors.push({
              row: rowNumber,
              field: 'Frecuencia',
              message: 'Frecuencia no válida. Valores permitidos: monthly, quarterly, four_monthly, biannual, annual',
            });
          }

          // Validar Renovación
          if (!row['Renovación*'] || row['Renovación*'].toString().trim() === '') {
            rowErrors.push({
              row: rowNumber,
              field: 'Renovación',
              message: 'El campo Renovación es obligatorio',
            });
          } else if (!isValidRenovation(row['Renovación*'].toString().trim())) {
            rowErrors.push({
              row: rowNumber,
              field: 'Renovación',
              message: 'Renovación no válida. Valores permitidos: first_day, last_day',
            });
          }

          // Si hay errores en esta fila, añadirlos a la lista
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            // Si no hay errores, crear el objeto servicio
            const basePrice = Number(row['Precio Base*']);
            const vat = Number(row['IVA (%)*']);
            const retention = row['Retención (%)'] && row['Retención (%)'].toString().trim() !== ''
              ? Number(row['Retención (%)'])
              : 0;

            // Calcular precio final
            const finalPrice = basePrice * (1 + vat / 100) * (1 - retention / 100);

            const service: Partial<Service> = {
              name: row['Nombre*'].toString().trim(),
              description: row['Descripción*'].toString().trim(),
              basePrice: basePrice,
              vat: vat,
              retention: retention,
              finalPrice: finalPrice,
              frequency: row['Frecuencia*'].toString().trim() as Service['frequency'],
              renovation: row['Renovación*'].toString().trim() as Service['renovation'],
            };

            services.push(service);
          }
        });

        resolve({
          valid: errors.length === 0,
          services,
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
