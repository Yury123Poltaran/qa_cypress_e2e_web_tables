// cypress/e2e/webTables.cy.js

// 1) игнорим ошибки чужих скриптов (реклама и т.п.), чтобы не падал beforeEach
Cypress.on('uncaught:exception', () => false);

describe('Web Tables', () => {
  // фабрика данных
  const makeUser = () => {
    const t = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    return {
      first: 'Ivan',
      last: 'Tester',
      email: `ivan.${t}@mail.com`,
      age: '36',
      salary: '1200',
      dept: 'QA',
    };
  };

  // общая функция добавления пользователя
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

  beforeEach(() => {
    // baseUrl = https://demoqa.com (в cypress.config.js)
    cy.visit('/webtables');
    // «якоря» загрузки страницы
    cy.get('#searchBox').should('be.visible').clear();
    cy.get('#addNewRecordButton').should('be.visible');
  });

  it('Pagination (real switch & assert page number)', function () {
    // добавляем достаточно записей, чтобы была 2+ страниц
    for (let i = 0; i < 12; i++) addUser(makeUser());

    // условный skip через then(), чтобы избежать гонок
    cy.get('body').then(($b) => {
      const hasPagination = $b.find('.-pagination, .-next .-btn').length > 0;
      if (!hasPagination) this.skip();
    });

    // помощник: поле номера страницы внутри блока пагинации
    const pageInput = () =>
      cy.get('.-pagination')
        .scrollIntoView()
        .find('input')
        .filter(':visible')
        .first();

    pageInput().should('exist').and('have.value', '1');
    cy.get('.-next .-btn').click();
    pageInput().should('have.value', '2');
    cy.get('.-previous .-btn').click();
    pageInput().should('have.value', '1');
  });

  it('Rows count selection changes number of visible rows', function () {
    // если селекта нет — корректно скипаем
    cy.get('body').then(($b) => {
      const hasSelect = $b.find('select, .rows-per-page, .page-size').length > 0;
      if (!hasSelect) this.skip();
    });

    // на всякий — заполняем таблицу
    for (let i = 0; i < 8; i++) addUser(makeUser());

    cy.get('select').first().select('5');
    cy.get('.rt-tbody .rt-tr-group:visible').should('have.length', 5);
  });

  it('Add a new worker (row-scoped assertions)', () => {
    const u = makeUser();
    addUser(u);

    // проверяем именно строку по уникальному email
    cy.get('#searchBox').type(u.email);
    cy.get('.rt-tbody')
      .contains('.rt-tr-group', u.email)
      .should('contain', u.first)
      .and('contain', u.last)
      .and('contain', u.dept);
  });

  it('Delete a worker', () => {
    const u = makeUser();
    addUser(u);

    cy.get('#searchBox').type(u.email);
    cy.get('[id^="delete-record-"]').first().click();
    cy.get('.rt-noData').should('contain', 'No rows found');
  });

  it('Delete all workers', () => {
    const deleteAll = () => {
      cy.get('body').then(($b) => {
        if ($b.find('[id^="delete-record-"]').length) {
          cy.get('[id^="delete-record-"]').first().click();
          deleteAll();
        }
      });
    };
    deleteAll();
    cy.get('.rt-noData').should('contain', 'No rows found');
  });

  it('Find a worker in search and edit it (row-scoped assertions)', () => {
    const u = makeUser();
    const upd = { dept: 'Automation', salary: '1500' };

    addUser(u);

    cy.get('#searchBox').type(u.email);
    cy.get('[id^="edit-record-"]').first().click();
    cy.get('#department').clear().type(upd.dept);
    cy.get('#salary').clear().type(upd.salary);
    cy.get('#submit').click();

    cy.get('#searchBox').clear().type(u.email);
    cy.get('.rt-tbody')
      .contains('.rt-tr-group', u.email)
      .should('contain', upd.dept)
      .and('contain', upd.salary);
  });

  it('Validate data in row after editing (row-scoped assertions)', () => {
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
    cy.get('.rt-tbody')
      .contains('.rt-tr-group', u.email)
      .should('contain', after.first)
      .and('contain', after.last)
      .and('contain', after.dept);
  });

  it('Search by all column values (assert the actual query)', () => {
    const u = makeUser();
    addUser(u);

    [u.first, u.last, u.email, u.age, u.salary, u.dept].forEach((q) => {
      cy.get('#searchBox').clear().type(q);
      cy.get('.rt-noData').should('not.exist');
      cy.get('.rt-tbody').should('contain', q); // проверяем именно текущий поисковый термин
    });
  });
});
