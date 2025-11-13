# SISTEMA DE CONTROLE DE ESTOQUE PARA ALMOXARIFADO 
## DESCRIÇÃO GERAL

    Este é um sistema completo de controle de estoque desenvolvido especificamente para o almoxarifado da SEMSC.

    Utiliza tecnologias modernas como Node.js, Express, MongoDB e uma interface web responsiva para proporcionar uma gestão eficiente
    e transparente dos materiais e suprimentos.

## FUNCIONALIDADES PRINCIPAIS

### 1. GESTÃO DE PRODUTOS
- **Cadastro automático**: Produtos recebem códigos sequenciais únicos automaticamente
- **Campos completos**: Descrição, quantidade, unidade, descrição complementar, validade, fornecedor, número do processo e observações
- **Edição completa**: Possibilidade de alterar todas as informações dos produtos
- **Exclusão segura**: Remove produto e todas as movimentações relacionadas
- **Busca em tempo real**: Filtragem rápida na tabela de produtos

### 2. REGISTRO DE ENTRADAS SIMPLIFICADAS
- **Entrada inteligente**: Se o produto não existe, é criado automaticamente; se existe, apenas incrementa a quantidade
- **Campos obrigatórios**: Descrição, quantidade, servidor almoxarifado e data
- **Registro automático**: Movimentação de entrada é registrada simultaneamente

### 3. REGISTRO DE SAÍDAS MANUAIS
- **Controle de estoque**: Verifica disponibilidade antes de permitir saída
- **Informações completas**: Produto, quantidade, servidor almoxarifado, data, setor responsável e servidor retirada
- **Validação automática**: Impede saídas superiores ao estoque disponível
- **Registro detalhado**: Todas as movimentações são armazenadas com timestamp

### 4. HISTÓRICO DE MOVIMENTAÇÕES
- **Visualização completa**: Tabela com todas as entradas e saídas realizadas
- **Filtros avançados**:
  - Por nome do produto
  - Por tipo (Entrada/Saída)
  - Por período (data inicial e final)
- **Dashboard dinâmico**: Mostra totais de entradas, saídas e saldo final em tempo real
- **Ordenação automática**: Movimentações mais recentes primeiro

### 5. INTERFACE MODERNA E RESPONSIVA
- **Design governamental**: Cores e layout adequados para órgãos públicos
- **Navegação intuitiva**: Menu fixo com destaque automático da seção atual
- **Responsividade total**: Funciona perfeitamente em desktop, tablet e mobile
- **Experiência fluida**: Transições suaves e feedback visual imediato

## BENEFÍCIOS

### CONTROLE E TRANSPARÊNCIA
- **Rastreabilidade total**: Cada movimentação é registrada com data e responsável
- **Auditoria facilitada**: Histórico completo permite verificações e relatórios

### EFICIÊNCIA OPERACIONAL
- **Agilidade no cadastro**: Entradas simplificadas reduzem tempo de trabalho
- **Busca rápida**: Localização imediata de produtos no estoque
- **Relatórios instantâneos**: Dashboard atualizado em tempo real

### ECONOMIA E SUSTENTABILIDADE
- **Redução de perdas**: Controle preciso evita desperdícios e extravios
- **Otimização de compras**: Visibilidade do estoque facilita planejamento de aquisições
- **Sustentabilidade**: Melhor gestão reduz compras desnecessárias

### SEGURANÇA E CONFIABILIDADE
- **Backup automático**: Dados armazenados em MongoDB com timestamps
- **Validações robustas**: Sistema impede operações inválidas

### FACILIDADE DE USO
- **Interface intuitiva**: Não requer treinamento extensivo
- **Instalação simples**: Sistema completo em um diretório
- **Manutenção mínima**: Tecnologias estáveis e documentadas

## REQUISITOS DO SISTEMA

### HARDWARE MÍNIMO
- Processador: 1 GHz ou superior
- Memória RAM: 2 GB
- Espaço em disco: 500 MB livres
- Conexão de rede: Não requer (sistema local)

### SOFTWARE
- Sistema Operacional: Windows 7 ou superior
- Navegador: Chrome, Firefox, Edge ou Safari (versão recente)

## INSTRUÇÕES DE INSTALAÇÃO E USO

### 1. PREPARAÇÃO INICIAL
1. Descompacte o arquivo do sistema em uma pasta de sua escolha
2. Certifique-se de que a pasta não está em local protegido pelo Windows
3. Execute o arquivo `iniciar.bat` como administrador na primeira vez

### 2. INICIALIZAÇÃO AUTOMÁTICA
1. Clique duas vezes no arquivo `iniciar.bat`
2. O sistema irá:
   - Iniciar o servidor MongoDB local
   - Iniciar o servidor Node.js da aplicação
   - Abrir a interface web no navegador padrão
3. Aguarde as mensagens de confirmação em cada etapa

### 3. USO DO SISTEMA

#### PRIMEIRO ACESSO
- A interface web será aberta automaticamente
- O sistema já estará pronto para uso
- Não há necessidade de configurações adicionais

#### REGISTRANDO ENTRADAS
1. Vá para a seção "Registrar Entrada Simplificada"
2. Digite a descrição do produto (ou selecione da lista)
3. Informe a quantidade recebida
4. Digite o nome do servidor almoxarifado responsável
5. Selecione a data da entrada
6. Clique em "Registrar Entrada"

#### CADASTRANDO PRODUTOS
1. Na seção "Estoque Atual", clique em "Editar" em qualquer produto existente
2. Preencha todos os campos desejados
3. Clique em "Salvar" para confirmar as alterações

#### REGISTRANDO SAÍDAS
1. Vá para a seção "Registrar Saída de Produto"
2. Digite ou selecione o produto da lista
3. Informe a quantidade a ser retirada
4. Digite o nome do servidor almoxarifado
5. Selecione a data da saída
6. Informe o setor responsável pela retirada
7. Digite o nome do servidor que está retirando
8. Clique em "Registrar Saída"

#### CONSULTANDO HISTÓRICO
1. Vá para a seção "Histórico de Movimentações"
2. Use os filtros para localizar movimentações específicas:
   - Digite parte do nome do produto
   - Selecione o tipo (Entrada ou Saída)
   - Defina período inicial e final
3. Clique em "Limpar filtros" para ver tudo novamente
4. Observe o dashboard com totais atualizados

### 4. MANUTENÇÃO E BACKUP

#### BACKUP DOS DADOS
- Os dados são armazenados na pasta `mongodb/data/db`
- Para backup, copie esta pasta inteira
- Para restauração, substitua a pasta pelos dados backupados

#### REINICIALIZAÇÃO
- Sempre use o `iniciar.bat` para iniciar o sistema
- Não feche as janelas do terminal abertas
- O sistema pode ser usado enquanto as janelas estiverem abertas

#### PROBLEMAS COMUNS
- **Porta ocupada**: Se aparecer erro de porta, feche outros programas usando a porta 3000
- **MongoDB não inicia**: Verifique se há outro MongoDB rodando ou arquivos corrompidos
- **Interface não abre**: Certifique-se de que o navegador não está bloqueando pop-ups

## SUPORTE TÉCNICO

### CONTATO
Para suporte técnico ou dúvidas:
- Nome: Pedro Marinho
- Telefone: [82 9 9346-2162]
- Email: [agente7828@gmail.com]

### LOGS DE ERRO
Em caso de problemas:
1. Verifique as mensagens nas janelas do terminal
2. Anote qualquer mensagem de erro
3. Reinicie o sistema usando `iniciar.bat`

## VERSÃO ATUAL
Versão: 1.0 (Finalizada)
Data de lançamento: [14/11/2025]
Desenvolvido por: Pedro D. C. Marinho

## LICENÇA
Este software é propriedade do órgão público municipal e seu uso é restrito aos servidores autorizados.
