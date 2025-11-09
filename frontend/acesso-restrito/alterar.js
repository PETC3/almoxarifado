// Função para recuperar parâmetros da URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Recuperar o ID do usuário da URL
const userId = getQueryParam('id');

// Verificar se o userId foi encontrado e atribuir ao campo oculto
if (userId) {
    document.getElementById('user-id').value = userId;
} else {
    console.log('ID do usuário não encontrado.');
}

// Adicionar item
document.getElementById("add-item-btn").addEventListener("click", function () {
    const itemName = document.getElementById("item-name").value;
    const itemCategory = document.getElementById("item-category").value;
    const itemQuantity = document.getElementById("item-quantity").value;
    const itemDescription = document.getElementById("item-description").value;
    

    if (itemName && itemQuantity && itemCategory && itemDescription) {
        const data = {
            name: itemName,
            category: itemCategory,
            quantity: itemQuantity,
            description: itemDescription
        };

        fetch("http://localhost:3000/add-item", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            alert("Item adicionado com sucesso!");
            document.getElementById("add-item-form").reset(); // Limpa o formulário
        })
        .catch(error => {
            console.error("Erro ao adicionar item:", error);
            alert("Erro ao adicionar item.");
        });
    } else {
        alert("Por favor, preencha todos os campos.");
    }
});

// Deletar item
document.getElementById("delete-item-btn").addEventListener("click", function () {
    const itemId = document.getElementById("item-id").value;

    if (itemId) {
        fetch(`http://localhost:3000/delete-item/${itemId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || "Item deletado com sucesso!");
            document.getElementById("delete-item-form").reset(); // Limpa o formulário
        })
        .catch(error => {
            console.error("Erro ao deletar item:", error);
            alert("Erro ao deletar item.");
        });
    } else {
        alert("Por favor, forneça um ID válido.");
    }
});

// Retirar item
document.getElementById("retirar-item-btn").addEventListener("click", function () {
    const itemNameCode = document.getElementById("item-name-code").value.trim();
    const itemQuantity = parseInt(document.getElementById("item-quantity-retirar").value);

    if (itemNameCode && itemQuantity > 0) {
        const data = {
            nameOrCode: itemNameCode,
            quantity: itemQuantity,
            userId: userId
        };

        fetch("http://localhost:3000/retirar-item", {
            method: "PUT", // Atualiza o estoque
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Item retirado com sucesso!");
                document.getElementById("retirar-item-form").reset(); // Limpa o formulário
            } else {
                alert(data.message || "Erro ao retirar item.");
            }
        })
        .catch(error => {
            console.error("Erro ao retirar item:", error);
            alert("Erro ao retirar item.");
        });
    } else {
        alert("Por favor, preencha os campos corretamente.");
    }
});
