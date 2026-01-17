import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (data, productName) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // -- Corporate Identity Constants --
    const primaryColor = [0, 159, 227]; // #009FE3
    const textColor = [60, 60, 60];

    // -- Helper: Header --
    const drawHeader = (pageNumber) => {
        // Logo area (simulated with text/shape)
        doc.setFillColor(...primaryColor);
        doc.rect(margin, 10, 10, 10, 'F'); // Blue square icon

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Dirección Técnica", margin + 14, 15);
        doc.setFont("helvetica", "normal");
        doc.text("IA LAB", margin + 14, 20);

        // Right Title
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.text("ANÁLISIS DE FDS", pageWidth - margin, 18, { align: 'right' });

        // Product Name (Centered)
        if (pageNumber === 1 && productName) {
            doc.setFontSize(16);
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "bold");
            const splitTitle = doc.splitTextToSize(productName.toUpperCase(), pageWidth - (margin * 2));
            doc.text(splitTitle, pageWidth / 2, 35, { align: 'center' });
            return 35 + (splitTitle.length * 7); // Return Y position
        }
        return 30; // Standard start Y
    };

    // -- Helper: Footer (Pagination) --
    const drawFooter = (pageNumber, totalPages) => {
        doc.setPage(pageNumber);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${pageNumber} de ${totalPages}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
        );
    };

    // Prepare key-value pairs for the table
    // We map the 12 cards to table rows
    const cardMapping = [
        { key: 'card1', title: '1. Identificación' },
        { key: 'card2', title: '2. Clasificación' },
        { key: 'card3', title: '3. Composición' },
        { key: 'card4', title: '4. Primeros Auxilios' },
        { key: 'card5', title: '5. Incendios' },
        { key: 'card6', title: '6. Vertido Accidental' },
        { key: 'card7', title: '7. Manipulación y Almacenamiento' },
        { key: 'card8', title: '8. Exposición/EPIs' },
        { key: 'card9', title: '9. Propiedades Físico-Químicas' },
        { key: 'card10', title: '10. Estabilidad y Reactividad' },
        { key: 'card11', title: '11. Toxicología' },
        { key: 'card12', title: '12. Residuos' }
    ];

    const tableBody = cardMapping.map(section => {
        const content = data[section.key];
        const formattedContent = Array.isArray(content) ? content.join('\n• ') : (content || 'No especificado');
        const finalContent = Array.isArray(content) ? '• ' + formattedContent : formattedContent;
        return [section.title.toUpperCase(), finalContent];
    });

    // Start logic
    let startY = drawHeader(1);
    if (productName) startY += 10; // Extra spacing after title

    doc.autoTable({
        startY: startY,
        head: [['Sección', 'Detalles']],
        body: tableBody,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 6,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            textColor: textColor,
            overflow: 'linebreak' // Wrap text
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold',
            fontSize: 11
        },
        columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' }, // Column 1 width
            1: { cellWidth: 'auto' }
        },
        margin: { top: 30, bottom: 20, left: margin, right: margin },
        didDrawPage: (data) => {
            // Redraw header on subsequent pages if needed (though autoTable handles usually)
            if (data.pageNumber > 1) {
                drawHeader(data.pageNumber);
            }
        }
    });

    // Post-processing for footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        drawFooter(i, totalPages);
    }

    // Save
    doc.save(`${productName || 'FDS_Informe'}.pdf`);
};
