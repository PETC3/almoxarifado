document.addEventListener("DOMContentLoaded", () => {
    const navItems = {
        "show_home": "home_content",
        "show_user": "user_content",
        "show_stock": "stock_content",
        "show_manage_inventory": "manage_content",
        "show_request": "request_content",
    };

    const mainDiv = document.querySelector("#main-content");

    Object.keys(navItems).forEach((menuId) => {
        const menuItem = document.getElementById(menuId);
        const contentId = navItems[menuId];

        if (menuItem) { // Verifica se o item de menu existe
            menuItem.addEventListener("click", async (e) => {
                e.preventDefault();

                // Esconde todos os conteúdos
                Object.values(navItems).forEach((id) => {
                    const content = document.getElementById(id);
                    if (content) { // Verifica se o conteúdo existe antes de acessar style
                        content.style.display = "none";
                    }
                });

                // Mostra o conteúdo associado ao item clicado
                const contentToShow = document.getElementById(contentId);
                if (contentToShow) { // Verifica se o conteúdo existe antes de alterar style
                    contentToShow.style.display = "block";

                    // Se for o menu "users", buscar e exibir os dados
                    if (menuId === "show_user") {
                        await loadUsers();
                    }
                    else if (menuId === "show_stock") {
                        await loadStock();
                    }
                    else if (menuId === "show_request") {
                        await loadRequests();
                    }


                } else {
                    console.error(`Elemento com ID "${contentId}" não encontrado.`);
                }
            });
        } else {
            console.error(`Elemento com ID "${menuId}" não encontrado no DOM.`);
        }
    });


    // Função para ler os registros na tabela de usuário
    async function loadUsers() {
        const membrosList = document.getElementById("user_select");

        try {
            // Fazendo a requisição ao back-end
            const response = await fetch("http://localhost:3000/usuarios");
            if (!response.ok) throw new Error("Erro ao buscar dados dos membros.");

            const membros = await response.json();

            // Criação da tabela
            const tableHeaders = `
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Admin</th>
                    </tr>
                </thead>
                <tbody>
                    ${membros.map((membro) => `
                        <tr>
                            <td>${membro.id}</td>
                            <td>${membro.username}</td>
                            <td>${membro.name}</td>
                            <td>${membro.type}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Exibir a tabela no elemento membrosList
        membrosList.innerHTML = tableHeaders;
        } catch (error) {
            console.error(error);
            membrosList.innerHTML = "<p>Erro ao carregar membros.</p>";
        }
    }

    // Função para adicionar um novo usuário
    const userForm = document.getElementById("add_user_form");
    userForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const name_user = document.getElementById("name").value;

        try {
            // Enviar dados para o backend para registrar o novo usuário
            const response = await fetch("http://localhost:3000/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password, name_user }), // Envia os dados como JSON
            });

            if (!response.ok) {
                throw new Error("Erro ao adicionar usuário.");
            }

            // Após adicionar o usuário, recarregar a lista de membros
            await loadUsers();

            // Exibir mensagem de sucesso
            const successMessage = document.getElementById("success_message");
            if (successMessage) {
                successMessage.style.display = "block"; // Exibe a mensagem
                setTimeout(() => {
                    successMessage.style.display = "none"; // Esconde a mensagem após 3 segundos
                }, 3000);
            }

            // Limpar o formulário
            userForm.reset();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar o membro.");
        }
    });

    // Função para carregar a tabela de estoque
    async function loadStock() {
        const stock_table = document.getElementById("stock_select");
        
        try {
            const response = await fetch("http://localhost:3000/estoque");
            const estoque = await response.json();
            
            // Mostrar a tabela completa
            show_stock_table(estoque);

            // Configura o botão de filtro
            const filterButton = document.getElementById("filter_button");
            if (filterButton) {
                filterButton.addEventListener("click", () => {
                    const filterType = document.getElementById("filter_type").value;
                    const filterValue = document.getElementById("filter_input").value.toLowerCase();

                    // Filtra os itens com base no tipo de filtro e valor
                    const filteredItems = estoque.filter(item =>
                        item[filterType]?.toString().toLowerCase().includes(filterValue)
                    );

                    // Recarrega a tabela com os itens filtrados
                    show_stock_table(filteredItems);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar tabela de estoque:", error);
            stock_table.innerHTML = "<p>Erro ao carregar a tabela de estoque.</p>";
        }
    }

    // Função para carregar a tabela de estoque com filtros
    function show_stock_table(estoque){
        const stock_table = document.getElementById("stock_select");

        let userTableHTML = `
                <h3>Tabela de Usuários</h3>
                <table border="1" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Quantidade</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            estoque.forEach(item => {
                userTableHTML += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.category}</td>
                        <td>${item.amount}</td>
                        <td>${item.description}</td>
                    </tr>
                `;
            });

            userTableHTML += "</tbody></table>";
            stock_table.innerHTML = userTableHTML;
    }

    // Função para carregar a tabela de pedidos
    async function loadRequests() {
        const request_table = document.getElementById("pedidos-tabela");

        try {
            const response = await fetch("http://localhost:3000/pedidos");
            const pedidos = await response.json();

            // Mostrar a tabela completa
            show_requests_table(pedidos);

            // Configura o botão de filtro
            const filterButton = document.getElementById("filter_button");
            if (filterButton) {
                filterButton.addEventListener("click", () => {
                    const userIdFilter = document.getElementById("filter-user-id").value;
                    const itemIdFilter = document.getElementById("filter-item-id").value;
                    const dayFilter = document.getElementById("filter-day").value;

                    // Filtra os pedidos com base nos filtros fornecidos
                    const filteredRequests = pedidos.filter(pedido => {
                        const matchesUserId = userIdFilter ? pedido.user_id == userIdFilter : true;
                        const matchesItemId = itemIdFilter ? pedido.item_id == itemIdFilter : true;
                        const matchesDay = dayFilter ? pedido.data === dayFilter : true;
                        return matchesUserId && matchesItemId && matchesDay;
                    });

                    // Recarrega a tabela com os pedidos filtrados
                    show_requests_table(filteredRequests);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar tabela de pedidos:", error);
            request_table.innerHTML = "<p>Erro ao carregar a tabela de pedidos.</p>";
        }
    }

    // Função para exibir a tabela de pedidos
    function show_requests_table(pedidos) {
        const request_table = document.getElementById("pedidos-tabela").getElementsByTagName('tbody')[0];

        let requestTableHTML = ''; // Limpar a tabela antes de preencher com os pedidos

        pedidos.forEach(pedido => {
            requestTableHTML += `
                <tr>
                    <td>${pedido.pedido_id}</td>
                    <td>${pedido.nome_usuario}</td>
                    <td>${pedido.nome_item_estoque}</td>
                    <td>${pedido.qtd_retirada}</td>
                    <td>${pedido.data_pedido}</td>
                </tr>
            `;
        });

        request_table.innerHTML = requestTableHTML;
    }
});