// src/app/flowstark/tickets/utils/xmlGenerator.ts
import { TicketWithRelations } from '../../../../types/models';

/**
 * Formatea una fecha en formato ISO 8601
 */
const formatDateForXML = (date: Date | undefined): string => {
  if (!date) return '';
  return date.toISOString();
};

/**
 * Formatea un número con 2 decimales
 */
const formatAmount = (amount: number): string => {
  return amount.toFixed(2);
};

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
 * Genera el XML para un ticket individual
 */
const generateTicketXML = (ticket: TicketWithRelations, index: number): string => {
  const clientName = ticket.clientInfo
    ? `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`
    : 'Cliente no encontrado';
  const serviceName = ticket.serviceInfo?.name || 'Servicio no encontrado';

  return `  <ticket id="${index + 1}">
    <ticketId>${escapeXML(ticket.id)}</ticketId>
    <status>${escapeXML(ticket.status)}</status>
    <amount currency="EUR">${formatAmount(ticket.amount)}</amount>
    <dueDate>${formatDateForXML(ticket.dueDate)}</dueDate>
    <generatedDate>${formatDateForXML(ticket.generatedDate)}</generatedDate>
    ${ticket.paidDate ? `<paidDate>${formatDateForXML(ticket.paidDate)}</paidDate>` : ''}
    <isManual>${ticket.isManual}</isManual>
    ${ticket.description ? `<description>${escapeXML(ticket.description)}</description>` : ''}
    <servicePeriod>
      <start>${formatDateForXML(ticket.serviceStart)}</start>
      <end>${formatDateForXML(ticket.serviceEnd)}</end>
    </servicePeriod>
    <client>
      <name>${escapeXML(clientName)}</name>
      ${ticket.clientInfo?.email ? `<email>${escapeXML(ticket.clientInfo.email)}</email>` : ''}
      ${ticket.clientInfo?.phone ? `<phone>${escapeXML(ticket.clientInfo.phone)}</phone>` : ''}
      ${ticket.clientInfo?.taxId ? `<taxId>${escapeXML(ticket.clientInfo.taxId)}</taxId>` : ''}
      ${ticket.clientInfo?.fiscalName ? `<fiscalName>${escapeXML(ticket.clientInfo.fiscalName)}</fiscalName>` : ''}
    </client>
    <service>
      <name>${escapeXML(serviceName)}</name>
      ${ticket.serviceInfo?.description ? `<description>${escapeXML(ticket.serviceInfo.description)}</description>` : ''}
      ${ticket.serviceInfo?.frequency ? `<frequency>${escapeXML(ticket.serviceInfo.frequency)}</frequency>` : ''}
    </service>
    ${ticket.subscriptionId ? `<subscriptionId>${escapeXML(ticket.subscriptionId)}</subscriptionId>` : ''}
  </ticket>`;
};

/**
 * Genera el XML completo con todos los tickets
 */
export const generateTicketsXML = (tickets: TicketWithRelations[]): string => {
  const now = new Date();
  const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);
  const paidTickets = tickets.filter(t => t.status === 'paid');
  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const paidAmount = paidTickets.reduce((sum, ticket) => sum + ticket.amount, 0);
  const pendingAmount = pendingTickets.reduce((sum, ticket) => sum + ticket.amount, 0);

  const ticketsXML = tickets.map((ticket, index) => generateTicketXML(ticket, index)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ticketsExport>
  <metadata>
    <exportDate>${formatDateForXML(now)}</exportDate>
    <totalTickets>${tickets.length}</totalTickets>
    <summary>
      <total>
        <count>${tickets.length}</count>
        <amount currency="EUR">${formatAmount(totalAmount)}</amount>
      </total>
      <paid>
        <count>${paidTickets.length}</count>
        <amount currency="EUR">${formatAmount(paidAmount)}</amount>
      </paid>
      <pending>
        <count>${pendingTickets.length}</count>
        <amount currency="EUR">${formatAmount(pendingAmount)}</amount>
      </pending>
    </summary>
  </metadata>
  <tickets>
${ticketsXML}
  </tickets>
</ticketsExport>`;
};

/**
 * Descarga el XML generado como archivo
 */
export const downloadTicketsXML = (tickets: TicketWithRelations[]): void => {
  const xml = generateTicketsXML(tickets);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
  link.href = url;
  link.download = `tickets_export_${timestamp}.xml`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
