# CP05 — Pipeline DevSecOps

Projeto acadêmico de DevSecOps and Cloud Computing. Conta: **guibezerra24**.

O site Arcanjosa Cloud calcula custos fictícios de servidores e armazenamento. Não usa credenciais, banco de dados, dependências JavaScript ou serviços pagos.

## Estrutura

```text
.github/workflows/security.yml  Três jobs independentes
.gitleaks.toml                  Regras padrão + padrão sintético do laboratório
.semgrep.yml                    Regra de análise estática contra eval
Dockerfile                     Nginx sem execução como root, porta 8080
site/                          HTML, CSS e JavaScript do simulador
scripts/criar-prova.mjs         Gera uma sabotagem por vez
relatorio.html                 Modelo editável para imprimir em PDF
```

## Executar o site

Com Docker Desktop iniciado, no terminal da pasta do projeto:

```powershell
docker build --pull -t cp05-site .
docker run --rm -p 8080:8080 cp05-site
```

Acesse http://localhost:8080. Use Ctrl+C para encerrar. O Docker copia apenas `site/` para a imagem.

Sem Docker, use `python -m http.server 8080 --directory site` e acesse o mesmo endereço. Sirva por HTTP para carregar o módulo JavaScript.

## O que o pipeline verifica

| Job | Escopo | Condição de falha |
| --- | --- | --- |
| Gitleaks | Commits, com histórico disponível | Segredo detectado por regra padrão ou pela regra sintética CP05 |
| Semgrep | Código JavaScript e TypeScript | Chamada direta a `eval`, identificada pela regra `cp05-no-eval` |
| Trivy | Imagem Docker construída no próprio job | Vulnerabilidade com severidade CRITICAL, mesmo sem correção disponível |

O Semgrep usa `--error` para que achados retornem código 1. A regra é intencionalmente focada no requisito da aula: não é uma análise completa de todas as vulnerabilidades possíveis. O Gitleaks mantém as regras padrão e acrescenta uma regra de laboratório para detectar um token fictício com prefixo CP05 e 32 caracteres hexadecimais. Ele não concede acesso a serviço algum.

O workflow roda em push, pull request e manualmente. Os três jobs são independentes, portanto uma falha não impede os outros de executar. Não há publicação automática da imagem. Uma Action vermelha sinaliza reprovação, mas não desfaz o push. Para impedir merge é necessário configurar os checks como obrigatórios nas regras de proteção de branch.

## Publicar pela primeira vez

Crie um repositório vazio chamado `cp05-devsecops` na sua conta pessoal do GitHub, sem README automático. Dentro desta pasta:

```powershell
git init -b main
git add .
git commit -m "feat: site Docker e pipeline DevSecOps"
git remote add origin https://github.com/guibezerra24/cp05-devsecops.git
git push -u origin main
```

Se o Git pedir identidade, configure seu nome e e-mail com `git config user.name` e `git config user.email` antes do commit. Faça a autenticação pela interface oficial quando solicitado. Não cole senhas ou tokens no código.

Abra a aba Actions e aguarde a execução inicial. Repositórios de conta pessoal não exigem licença do Gitleaks Action. O `GITHUB_TOKEN` é gerado automaticamente pelo GitHub, sem criar um secret manual.

## Prova 1: segredo falso

Partindo da versão principal limpa, execute:

```powershell
git switch main
git switch -c prova/gitleaks
node scripts/criar-prova.mjs gitleaks
git add sabotagem/credencial-falsa.txt
git commit -m "test: detectar credencial sintetica com Gitleaks"
git push -u origin prova/gitleaks
```

Abra a execução dessa branch e o job Gitleaks. Capture a identificação do repositório, a data ou execução, a falha e o trecho do log que identifica `cp05-segredo-sintetico`. Uma falha de download ou permissão não é prova de detecção.

Não faça merge dessa branch na main. Apenas apagar o arquivo em um novo commit pode manter a exposição no histórico. Em um vazamento real é necessário revogar ou rotacionar a credencial, além de corrigir o código.

## Prova 2: código vulnerável

Crie uma segunda branch a partir da main, não da branch anterior:

```powershell
git switch main
git switch -c prova/semgrep
node scripts/criar-prova.mjs semgrep
git add sabotagem/codigo-inseguro.js
git commit -m "test: detectar eval com Semgrep"
git push -u origin prova/semgrep
```

Capture o job Semgrep vermelho e o log com `cp05-no-eval`, o arquivo e a linha detectada. A função de demonstração não é executada nem importada pelo site. O risco é interpretar entrada não confiável como código. O simulador usa `Number`, validação e operações aritméticas explícitas.

Não faça merge dessa branch na main.

## Prova 3: imagem sem CVE crítico detectado

Na execução da main, abra o job Trivy e capture o término bem-sucedido da análise e a identificação da imagem ou do commit. Essa evidência significa ausência de achados CRITICAL na imagem e na base consultada naquela execução, não ausência absoluta de vulnerabilidades.

Se aparecer um CVE crítico, registre o CVE, o pacote, a versão instalada e a versão corrigida. Atualize a imagem base para uma versão corrigida e rode novamente. Não remova o filtro, não use `continue-on-error` e não suprima o achado para simular aprovação. O Dockerfile usa uma tag atualizável com `--pull`; o resultado pode mudar conforme novas imagens e CVEs sejam publicados.

O slide enumera apenas duas provas, mas cita três jobs e as notas incluem Trivy. Esta implementação inclui a evidência da imagem limpa para cobrir essa terceira barreira. Se o professor exigir também falha do Trivy, será preciso escolher e testar uma imagem de laboratório com CVE crítico conhecido, sem implantá-la.

## PDF da entrega

Abra `relatorio.html` no navegador, preencha nome, RM e turma, insira os prints verdadeiros e os links das Actions. Revise os parágrafos para refletir exatamente os logs e clique em **Salvar em PDF**. Na impressão selecione A4 e destino Salvar como PDF. O formulário não envia dados à internet nem salva alterações após fechar a página.

Para cada prova, mostre o resultado e a causa. Se necessário, use um print do resumo e outro do log. Entregue o link do repositório e o PDF pelo canal indicado pelo professor. Volte à main ao terminar: `git switch main`.

## Referências técnicas

- [Gitleaks Action](https://github.com/gitleaks/gitleaks-action)
- [Gitleaks e regras](https://github.com/gitleaks/gitleaks)
- [Semgrep: opções de CLI e códigos de saída](https://docs.semgrep.dev/cli-reference)
- [Trivy Action](https://github.com/aquasecurity/trivy-action)
- [Nginx sem privilégios](https://github.com/nginx/docker-nginx-unprivileged)

As versões de Actions seguem as referências consultadas em 09/10/2026. As tags do Nginx e do contêiner Semgrep são atualizáveis. Em um projeto de produção, fixe imagens por digest e Actions por SHA verificado, com um processo de atualização.
