// src/app/flowstark/tickets/utils/sepaXmlGenerator.ts
// Generador de ficheros SEPA pain.008.001.02 (Adeudo Directo SEPA Core)

import { TicketWithRelations, Client } from '../../../../types/models';
import { UserProfile } from '../../../../services/userProfileService';

/**
 * Interfaz para los datos del acreedor (usuario de Flowstark)
 */
interface CreditorData {
	name: string;
	iban: string;
	bic?: string;
	creditorId: string; // Identificador de acreedor SEPA
}

/**
 * Interfaz para una transacción de adeudo directo
 */
interface DirectDebitTransaction {
	ticket: TicketWithRelations;
	client: Client;
	sequenceType: 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
}

/**
 * Interfaz para un grupo de pagos (agrupados por fecha de cobro)
 */
interface PaymentGroup {
	collectionDate: Date;
	transactions: DirectDebitTransaction[];
}

/**
 * Escapa caracteres especiales para XML
 */
const escapeXML = (str: string | undefined): string => {
	if (!str) return '';

	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
};

/**
 * Formatea una fecha en formato SEPA (YYYY-MM-DD)
 */
const formatSepaDate = (date: Date): string => {
	return date.toISOString().split('T')[0];
};

/**
 * Formatea una fecha y hora en formato ISO para SEPA (sin milisegundos ni Z)
 * Formato: YYYY-MM-DDTHH:MM:SS
 */
const formatSepaDateTime = (date: Date): string => {
	return date.toISOString().slice(0, 19);
};

/**
 * Formatea un importe en formato SEPA (2 decimales, punto como separador)
 */
const formatSepaAmount = (amount: number): string => {
	return amount.toFixed(2);
};

/**
 * Limpia un IBAN eliminando espacios
 */
const cleanIban = (iban: string): string => {
	return iban.replace(/\s/g, '').toUpperCase();
};

/**
 * Genera un ID único para el mensaje SEPA
 */
const generateMessageId = (): string => {
	const now = new Date();
	const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

	return `FLOWSTARK-${timestamp}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

/**
 * Genera un ID único para el pago
 */
const generatePaymentId = (index: number): string => {
	const now = new Date();
	const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);

	return `PMT-${timestamp}-${String(index).padStart(4, '0')}`;
};

/**
 * Genera un End-to-End ID único para cada transacción
 */
const generateEndToEndId = (ticketId: string): string => {
	return `E2E-${ticketId.slice(0, 25)}`;
};

/**
 * Determina el tipo de secuencia (FRST/RCUR) para un cliente
 * FRST = Primera vez que se cobra a este cliente
 * RCUR = Cobros recurrentes (ya se ha cobrado antes)
 */
export const determineSequenceType = (
	client: Client,
	paidTicketsCount: number
): 'FRST' | 'RCUR' => {
	// Si el cliente ya tiene tickets pagados con domiciliación, es RCUR
	if (paidTicketsCount > 0) {
		return 'RCUR';
	}

	// Si es el primer cobro, es FRST
	return 'FRST';
};

/**
 * Agrupa los tickets por fecha de cobro (dueDate)
 */
const groupTicketsByCollectionDate = (
	tickets: TicketWithRelations[],
	clientPaidTicketsMap: Map<string, number>
): PaymentGroup[] => {
	const groups = new Map<string, PaymentGroup>();

	for (const ticket of tickets) {
		if (!ticket.clientInfo || !ticket.dueDate) continue;

		const dateKey = formatSepaDate(ticket.dueDate);
		const client = ticket.clientInfo;
		const paidCount = clientPaidTicketsMap.get(client.id || '') || 0;

		const transaction: DirectDebitTransaction = {
			ticket,
			client,
			sequenceType: determineSequenceType(client, paidCount)
		};

		if (groups.has(dateKey)) {
			groups.get(dateKey)!.transactions.push(transaction);
		} else {
			groups.set(dateKey, {
				collectionDate: ticket.dueDate,
				transactions: [transaction]
			});
		}
	}

	// Ordenar por fecha de cobro
	return Array.from(groups.values()).sort(
		(a, b) => a.collectionDate.getTime() - b.collectionDate.getTime()
	);
};

/**
 * Genera el XML de una transacción individual (DrctDbtTxInf)
 */
const generateTransactionXML = (
	transaction: DirectDebitTransaction,
	creditor: CreditorData
): string => {
	const { ticket, client, sequenceType } = transaction;
	const mandate = client.sepaMandate;

	if (!mandate) {
		throw new Error(`Cliente ${client.firstName} ${client.lastName} no tiene mandato SEPA`);
	}

	const clientName = client.fiscalName || `${client.firstName} ${client.lastName}`;
	const description = ticket.description ||
		`Servicio: ${ticket.serviceInfo?.name || 'N/A'} - Período: ${formatSepaDate(ticket.serviceStart)} a ${formatSepaDate(ticket.serviceEnd)}`;

	return `      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${escapeXML(generateEndToEndId(ticket.id || ''))}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="EUR">${formatSepaAmount(ticket.amount)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${escapeXML(mandate.mandateId)}</MndtId>
            <DtOfSgntr>${formatSepaDate(mandate.signatureDate)}</DtOfSgntr>
            <AmdmntInd>false</AmdmntInd>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            ${client.bank ? `<BIC>${escapeXML(client.bank)}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${escapeXML(clientName)}</Nm>
          ${client.taxId ? `<Id>
            <PrvtId>
              <Othr>
                <Id>${escapeXML(client.taxId)}</Id>
                <SchmeNm>
                  <Prtry>SEPA</Prtry>
                </SchmeNm>
              </Othr>
            </PrvtId>
          </Id>` : ''}
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${cleanIban(client.iban)}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${escapeXML(description.slice(0, 140))}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>`;
};

/**
 * Genera el XML de un grupo de pagos (PmtInf)
 */
const generatePaymentInfoXML = (
	group: PaymentGroup,
	creditor: CreditorData,
	paymentIndex: number
): string => {
	const totalAmount = group.transactions.reduce(
		(sum, t) => sum + t.ticket.amount,
		0
	);
	const paymentId = generatePaymentId(paymentIndex);

	// Agrupar por tipo de secuencia (FRST y RCUR deben ir en bloques separados según la norma)
	const frstTransactions = group.transactions.filter(t => t.sequenceType === 'FRST');
	const rcurTransactions = group.transactions.filter(t => t.sequenceType === 'RCUR');

	let paymentInfos = '';

	// Generar PmtInf para FRST si hay transacciones
	if (frstTransactions.length > 0) {
		const frstAmount = frstTransactions.reduce((sum, t) => sum + t.ticket.amount, 0);
		paymentInfos += generateSinglePaymentInfoXML(
			frstTransactions,
			creditor,
			`${paymentId}-FRST`,
			group.collectionDate,
			'FRST',
			frstAmount
		);
	}

	// Generar PmtInf para RCUR si hay transacciones
	if (rcurTransactions.length > 0) {
		const rcurAmount = rcurTransactions.reduce((sum, t) => sum + t.ticket.amount, 0);
		paymentInfos += generateSinglePaymentInfoXML(
			rcurTransactions,
			creditor,
			`${paymentId}-RCUR`,
			group.collectionDate,
			'RCUR',
			rcurAmount
		);
	}

	return paymentInfos;
};

/**
 * Genera un bloque PmtInf individual
 */
const generateSinglePaymentInfoXML = (
	transactions: DirectDebitTransaction[],
	creditor: CreditorData,
	paymentId: string,
	collectionDate: Date,
	sequenceType: 'FRST' | 'RCUR',
	totalAmount: number
): string => {
	const transactionsXML = transactions
		.map(t => generateTransactionXML(t, creditor))
		.join('\n');

	return `    <PmtInf>
      <PmtInfId>${escapeXML(paymentId)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${transactions.length}</NbOfTxs>
      <CtrlSum>${formatSepaAmount(totalAmount)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
        <LclInstrm>
          <Cd>CORE</Cd>
        </LclInstrm>
        <SeqTp>${sequenceType}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${formatSepaDate(collectionDate)}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXML(creditor.name)}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${cleanIban(creditor.iban)}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId>
          ${creditor.bic ? `<BIC>${escapeXML(creditor.bic)}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
        </FinInstnId>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${escapeXML(creditor.creditorId)}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${transactionsXML}
    </PmtInf>
`;
};

/**
 * Valida que los tickets tengan todos los datos necesarios para generar la remesa
 */
export const validateTicketsForSepa = (
	tickets: TicketWithRelations[],
	creditor: CreditorData
): { valid: boolean; errors: string[] } => {
	const errors: string[] = [];

	// Validar datos del acreedor
	if (!creditor.name) errors.push('Falta el nombre del acreedor');
	if (!creditor.iban) errors.push('Falta el IBAN del acreedor');
	if (!creditor.creditorId) errors.push('Falta el Identificador de Acreedor SEPA');

	// Validar cada ticket
	for (const ticket of tickets) {
		const clientName = ticket.clientInfo
			? `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`
			: 'Desconocido';

		if (!ticket.clientInfo) {
			errors.push(`Ticket ${ticket.id}: No tiene cliente asociado`);
			continue;
		}

		if (!ticket.clientInfo.iban) {
			errors.push(`Cliente "${clientName}": No tiene IBAN configurado`);
		}

		if (!ticket.clientInfo.sepaMandate) {
			errors.push(`Cliente "${clientName}": No tiene mandato SEPA`);
		}

		if (ticket.paymentMethod !== 'direct_debit') {
			errors.push(`Ticket ${ticket.id}: El método de pago no es domiciliación`);
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
};

/**
 * Genera el fichero XML SEPA pain.008.001.02 completo
 */
export const generateSepaXML = (
	tickets: TicketWithRelations[],
	creditor: CreditorData,
	clientPaidTicketsMap: Map<string, number>
): string => {
	const messageId = generateMessageId();
	const creationDateTime = formatSepaDateTime(new Date());
	const totalTransactions = tickets.length;
	const totalAmount = tickets.reduce((sum, t) => sum + t.amount, 0);

	// Agrupar tickets por fecha de cobro
	const paymentGroups = groupTicketsByCollectionDate(tickets, clientPaidTicketsMap);

	// Generar XML de cada grupo de pagos
	const paymentInfosXML = paymentGroups
		.map((group, index) => generatePaymentInfoXML(group, creditor, index))
		.join('');

	return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${escapeXML(messageId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${totalTransactions}</NbOfTxs>
      <CtrlSum>${formatSepaAmount(totalAmount)}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXML(creditor.name)}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${escapeXML(creditor.creditorId)}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
${paymentInfosXML}  </CstmrDrctDbtInitn>
</Document>`;
};

/**
 * Crea los datos del acreedor desde el perfil de usuario
 */
export const createCreditorFromProfile = (profile: UserProfile): CreditorData | null => {
	if (!profile.sepaCreditorId || !profile.sepaIban) {
		return null;
	}

	return {
		name: profile.commercialName || profile.name || 'Empresa',
		iban: profile.sepaIban,
		bic: profile.sepaBic,
		creditorId: profile.sepaCreditorId
	};
};

/**
 * Descarga el XML SEPA generado como archivo
 */
export const downloadSepaXML = (
	tickets: TicketWithRelations[],
	creditor: CreditorData,
	clientPaidTicketsMap: Map<string, number>
): void => {
	const xml = generateSepaXML(tickets, creditor, clientPaidTicketsMap);
	const blob = new Blob([xml], { type: 'application/xml' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	const now = new Date();
	const timestamp = now.toISOString().split('T')[0];
	link.href = url;
	link.download = `remesa_sepa_${timestamp}.xml`;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};
