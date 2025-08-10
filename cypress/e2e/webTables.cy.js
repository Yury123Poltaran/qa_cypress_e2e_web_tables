describe('Web Tables', () => {
  const makeUser = () => {
    const t = Date.now();
    return { first: 'Ivan', last: 'Tester', email: `ivan.${t}@mail.com`, age: '36', salary: '1200', dept: 'QA' };
  };

  beforeEach(() => {
    cy.visit('/webtables');
    cy.get('#searchBox').clear();
    cy.contains('Web Tables').should('be.visible');
    cy.get('#addNewRecordButton').should('be.visible');
  });

  it('Pagination (skip if absent)', function () {
    const hasPagination = Cypress.$('.-pagination, .pagination').length > 0;
    if (!hasPagination) this.skip();
    cy.get('.-pagination, .pagination').should('be.visible');
  });

  it('Rows count selection (skip if absent)', function () {
    const hasPageSize = Cypress.$('select, .rows-per-page, .page-size').length > 0;
    if (!hasPageSize) this.skip();
    cy.get('select').first().select('10');
  });

  it('Add a new worker', () => {
    const u = makeUser();
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(u.first);
    cy.get('#lastName').type(u.last);
    cy.get('#userEmail').type(u.email);
    cy.get('#age').type(u.age);
    cy.get('#salary').type(u.salary);
    cy.get('#department').type(u.dept);
    cy.get('#submit').click();
    cy.get('#searchBox').type(u.email);
    cy.get('.rt-tbody').should('contain', u.first).and('contain', u.last).and('contain', u.dept).and('contain', u.email);
  });

  it('Delete a worker', () => {
    const u = makeUser();
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(u.first);
    cy.get('#lastName').type(u.last);
    cy.get('#userEmail').type(u.email);
    cy.get('#age').type(u.age);
    cy.get('#salary').type(u.salary);
    cy.get('#department').type(u.dept);
    cy.get('#submit').click();
    cy.get('#searchBox').type(u.email);
    cy.get('[id^="delete-record-"]').first().click();
    cy.get('.rt-noData').should('contain', 'No rows found');
  });

  it('Delete all workers', () => {
    const removeAll = () => {
      cy.get('body').then($b => {
        if ($b.find('[id^="delete-record-"]').length) {
          cy.get('[id^="delete-record-"]').first().click();
          removeAll();
        } else {
          cy.get('.rt-noData').should('contain', 'No rows found');
        }
      });
    };
    removeAll();
  });

  it('Find a worker in search and edit it', () => {
    const u = makeUser();
    const upd = { dept: 'Automation', salary: '1500' };
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(u.first);
    cy.get('#lastName').type(u.last);
    cy.get('#userEmail').type(u.email);
    cy.get('#age').type(u.age);
    cy.get('#salary').type(u.salary);
    cy.get('#department').type(u.dept);
    cy.get('#submit').click();
    cy.get('#searchBox').type(u.email);
    cy.get('[id^="edit-record-"]').first().click();
    cy.get('#department').clear().type(upd.dept);
    cy.get('#salary').clear().type(upd.salary);
    cy.get('#submit').click();
    cy.get('#searchBox').clear().type(u.email);
    cy.get('.rt-tbody').should('contain', upd.dept).and('contain', upd.salary);
  });

  it('Validate data in row after editing', () => {
    const u = makeUser();
    const after = { first: 'Oleh', last: 'QA', dept: 'R&D' };
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(u.first);
    cy.get('#lastName').type(u.last);
    cy.get('#userEmail').type(u.email);
    cy.get('#age').type(u.age);
    cy.get('#salary').type(u.salary);
    cy.get('#department').type(u.dept);
    cy.get('#submit').click();
    cy.get('#searchBox').type(u.email);
    cy.get('[id^="edit-record-"]').first().click();
    cy.get('#firstName').clear().type(after.first);
    cy.get('#lastName').clear().type(after.last);
    cy.get('#department').clear().type(after.dept);
    cy.get('#submit').click();
    cy.get('#searchBox').clear().type(u.email);
    cy.get('.rt-tbody').should('contain', after.first).and('contain', after.last).and('contain', after.dept);
  });

  it('Check search by all column values', () => {
    const u = makeUser();
    cy.get('#addNewRecordButton').click();
    cy.get('#firstName').type(u.first);
    cy.get('#lastName').type(u.last);
    cy.get('#userEmail').type(u.email);
    cy.get('#age').type(u.age);
    cy.get('#salary').type(u.salary);
    cy.get('#department').type(u.dept);
    cy.get('#submit').click();
    [u.first, u.last, u.email, u.age, u.salary, u.dept].forEach(q => {
      cy.get('#searchBox').clear().type(q);
      cy.get('.rt-noData').should('not.exist');
      cy.get('.rt-tbody').should('contain', u.email);
    });
  });
});
