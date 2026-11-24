describe('Inicio', () => {
    it('muestra el mensaje principal y el enlace a proyectos', () => {
        cy.visit('http://localhost:3001/');

        cy.contains('h1', 'Tu código puede mover a un colectivo')
            .should('be.visible');

        cy.contains('a', 'Ver proyectos')
            .should('be.visible')
            .and('have.attr', 'href', '/proyectos');
    });
});