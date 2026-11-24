describe('Registro', () => {
    it('permite elegir el tipo de cuenta colaborador', () => {
        cy.visit('http://localhost:3001/registro');

        cy.contains('[role="group"] button', 'Colaborador').click();

        cy.contains('[role="group"] button', 'Colaborador')
            .should('have.attr', 'aria-pressed', 'true');

        cy.contains('[role="group"] button', 'Colectivo')
            .should('have.attr', 'aria-pressed', 'false');
    });
});