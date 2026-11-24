describe('Filtro de habilidades en proyectos', () => {
    it('permite abrir y cerrar el filtro', () => {
        cy.visit('http://localhost:3001/proyectos');

        cy.contains('button', 'Filtrar por habilidades')
            .should('have.attr', 'aria-expanded', 'false')
            .click()
            .should('have.attr', 'aria-expanded', 'true');

        cy.contains('button', 'Filtrar por habilidades')
            .click()
            .should('have.attr', 'aria-expanded', 'false');
    });
});