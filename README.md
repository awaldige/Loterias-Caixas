# Resultados das Loterias

Este é um projeto web simples que permite consultar os resultados de diversas loterias da Caixa Econômica Federal, como Mega-Sena, Quina, Lotofácil, Dia de Sorte, Loteca, Dupla Sena, Lotomania, +Milionária, Super Sete e Timemania.

## Funcionalidades

- **Interface Intuitiva:** Apresenta um card para cada modalidade de loteria.
- **Consulta por Concurso:** Permite ao usuário digitar o número do concurso desejado para cada loteria.
- **Exibição de Resultados:** Mostra a data da apuração e os números sorteados para a maioria das loterias.
- **Informações Específicas:** Exibe informações adicionais como os trevos da sorte para a +Milionária e os resultados dos jogos para a Loteca.
- **Tratamento de Erros:** Exibe mensagens de erro caso o concurso não seja encontrado ou a API esteja indisponível.

## Tecnologias Utilizadas

- **HTML:** Estrutura da página web.
- **CSS:** Estilização da interface, incluindo layout responsivo com Grid.
- **JavaScript:** Lógica para interagir com o usuário, fazer requisições à API e exibir os resultados dinamicamente.
- **API:** Utiliza a API pública não oficial do Portal de Loterias da Caixa para buscar os resultados.

## Como Executar o Projeto

1.  **Clone o repositório (opcional):** Se este código estiver em um repositório Git, você pode cloná-lo para sua máquina local.
    ```bash
    git clone https://github.com/awaldige/Loterias-Caixas
    ```
2.  **Abra o arquivo `index.html`:** Navegue até a pasta onde o arquivo `index.html` está salvo e abra-o com seu navegador web preferido.

## Estrutura de Arquivos

/
├── index.html      # Arquivo HTML principal
├── style.css       # Arquivo CSS para estilos
└── script.js       # Arquivo JavaScript com a lógica da aplicação


## Notas

- Este projeto utiliza uma API pública não oficial. A disponibilidade e a estrutura dos dados podem mudar sem aviso prévio.
- A funcionalidade e as informações exibidas podem variar dependendo da modalidade da loteria e da disponibilidade dos dados na API.
- Para a Loteca, os resultados dos jogos são exibidos individualmente.
- Para a +Milionária, as dezenas e os trevos da sorte são exibidos separadamente.
- Para a Timemania, o time do coração também é exibido.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para reportar issues, sugerir melhorias ou enviar pull requests.

## Autor

André Waldige ou (https://github.com/awaldige/Loterias-Caixas)
