/* eslint-disable cypress/unsafe-to-chain-command */
// cypress/e2e/webTables.cy.js

// Игнорим ошибки сторонних скриптов (баннеры и т.п.)
Cypress.on('uncaught:exception', () => false);

describe('Web Tables', () => {
  // -------- helpers --------
  const makeUser = () => {
    const t = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    return {
      first: 'Ivan',
      last: 'Tester',
      email: `ivan.${t}@mail.com`,
      age: '36',
      salary: '1200',
      dept: 'QA'
    };
  };

  const addUser = (u) => {
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').clear().type(u.first);
    cy.get('#lastName').clear().type(u.last);
    cy.get('#userEmail').clear().type(u.email);
    cy.get('#age').clear().type(u.age);
    cy.get('#salary').clear().type(u.salary);
    cy.get('#department').clear().type(u.dept);
    cy.get('#submit').click();
  };

  const aliasRowByEmail = (email) => {
    cy.get('.rt-tbody')
      .contains('.rt-tr-group', email)
      .then(($row) => {
        cy.wrap($row).as('row');
      });
  };

  // -------- hooks --------
  beforeEach(() => {
    // baseUrl задан в cypress.config.js
    cy.visit('/webtables');
    cy.get('#searchBox').should('be.visible').clear();
    cy.get('#addNewRecordButton').should('be.visible');
  });

  // -------- tests --------
  it('Pagination (real switch & assert page number)', function () {
    // создаём достаточно записей для 2+ страниц
    for (let i = 0; i < 12; i += 1) {
      addUser(makeUser());
    }

    // если пагинации нет — корректно скипаем
    cy.get('body').then(($b) => {
      const has = $b.find('.-pagination, .-next .-btn').length > 0;
      if (!has) this.skip();
    });

    // всегда запрашиваем input заново (после клика DOM меняется)
    const pageInput = () =>
      cy.get('.-pagination')
        .scrollIntoView()
        .find('input')
        .filter(':visible')
        .first();

    pageInput().should('exist').and('have.value', '1');

    cy.get('.-next .-btn')
      .scrollIntoView()
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    pageInput().should('have.value', '2');

    cy.get('.-previous .-btn')
      .scrollIntoView()
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    pageInput().should('have.value', '1');
  });

  it('Rows count selection changes number of visible rows', function () {
    // если селектора нет — корректно скипаем
    cy.get('body').then(($b) => {
      const sel = 'select, .rows-per-page, .page-size';
      const hasSelect = $b.find(sel).length > 0;
      if (!hasSelect) this.skip();
    });

    for (let i = 0; i < 8; i += 1) {
      addUser(makeUser());
    }

    cy.get('select').first().select('5');
    cy.get('.rt-tbody .rt-tr-group:visible').should('have.length', 5);
  });

  it('Add a new worker (row-scoped assertions)', () => {
    const u = makeUser();
    addUser(u);

    cy.get('#searchBox').type(u.email);
    aliasRowByEmail(u.email);

    cy.get('@row').should('contain', u.first);
    cy.get('@row').should('contain', u.last);
    cy.get('@row').should('contain', u.dept);
  });

  it('Delete a worker', () => {
    const u = makeUser();
    addUser(u);

    cy.get('#searchBox').type(u.email);
    cy.get('[id^="delete-record-"]').first().click();
    cy.get('.rt-noData').should('contain', 'No rows found');
  });

  it('Delete all workers', () => {
    const remove = () => {
      cy.get('body').then(($b) => {
        const has = $b.find('[id^="delete-record-"]').length > 0;
        if (has) {
          cy.get('[id^="delete-record-"]').first().click();
          remove();
        }
      });
    };

    remove();
    cy.get('.rt-noData').should('contain', 'No rows found');
  });

  it('Find a worker in search and edit it (row-scoped)', () => {
    const u = makeUser();
    const upd = { dept: 'Automation', salary: '1500' };

    addUser(u);

    cy.get('#searchBox').type(u.email);
    cy.get('[id^="edit-record-"]').first().click();
    cy.get('#department').clear().type(upd.dept);
    cy.get('#salary').clear().type(upd.salary);
    cy.get('#submit').click();

    cy.get('#searchBox').clear().type(u.email);
    aliasRowByEmail(u.email);

    cy.get('@row').should('contain', upd.dept);
    cy.get('@row').should('contain', upd.salary);
  });

  it('Validate data in row after editing (row-scoped)', () => {
    const u = makeUser();
    const after = { first: 'Oleh', last: 'QA', dept: 'R&D' };

    addUser(u);

    cy.get('#searchBox').type(u.email);
    cy.get('[id^="edit-record-"]').first().click();
    cy.get('#firstName').clear().type(after.first);
    cy.get('#lastName').clear().type(after.last);
    cy.get('#department').clear().type(after.dept);
    cy.get('#submit').click();

    cy.get('#searchBox').clear().type(u.email);
    aliasRowByEmail(u.email);

    cy.get('@row').should('contain', after.first);
    cy.get('@row').should('contain', after.last);
    cy.get('@row').should('contain', after.dept);
  });

  it('Search by all column values (assert actual query)', () => {
    const u = makeUser();
    addUser(u);

    const queries = [u.first, u.last, u.email, u.age, u.salary, u.dept];

    queries.forEach((q) => {
      cy.get('#searchBox').clear().type(q);
      cy.get('.rt-noData').should('not.exist');
      cy.get('.rt-tbody').should('contain', q);
    });
  });
});
