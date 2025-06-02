// functions/src/index.ts

// Importa o módulo principal de functions para o logger e utilitários
import * as functions from "firebase-functions";
// Importa especificamente o módulo HTTPS da V2, incluindo onCall e CallableRequest
import { onCall, CallableRequest } from "firebase-functions/v2/https";
// *** CORREÇÃO: Adicionar a importação do Pool ***
import { Pool } from "pg";

// import * as admin from "firebase-admin"; // Descomente se for usar o Admin SDK para validar algo além do UID básico
// admin.initializeApp(); // Descomente se for usar o Admin SDK

// Configuração do Logger
const logger = functions.logger;

// Acessar o segredo configurado - OBTENHA o valor no escopo global
const neonDbUrl = process.env.NEON_DATABASE_URL;

// *** CORREÇÃO: REMOVER A VALIDAÇÃO DO SEGREDO DO ESCOPO GLOBAL ***
// A validação no escopo global causa erro no deploy de 2ª Geração,
// pois o segredo pode não estar injetado durante a análise inicial.
// A validação deve ocorrer DENTRO do handler da função.
/*
if (!neonDbUrl) {
  const errorMessage = "NEON_DATABASE_URL secret is not set or not accessible during function initialization. Ensure it is configured via firebase functions:secrets:set and listed in firebase.json secretEnv.";
  logger.error(errorMessage);
  throw new Error(errorMessage);
}
*/

// Configuração do Pool do PostgreSQL - MANTENHA AQUI
// O Pool será configurado com a variável de ambiente no momento da inicialização da função.
// Se neonDbUrl for undefined aqui, a criação do Pool pode falhar silenciosamente ou
// o erro ocorrerá apenas na primeira tentativa de conexão dentro do handler.
// É mais seguro verificar a variável DENTRO do handler antes de usar o pool.
const pool = new Pool({
  connectionString: neonDbUrl, // O Pool usará o valor de process.env.NEON_DATABASE_URL
  ssl: {
    rejectUnauthorized: false, // Ajuste conforme necessário para o Neon. Considere 'true' em produção com CA.
  },
  max: 5, // Número máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err: Error) => {
  logger.error("Erro inesperado no cliente ocioso do Pool PG:", err);
});

/**
 * Função Callable HTTP (2ª Geração) para testar a conexão com o banco de dados Neon.
 * **REQUER AUTENTICAÇÃO DO USUÁRIO FIREBASE.**
 */
export const testDbConnection = onCall({ // <-- Mudei de onRequest para onCall
  secrets: ["NEON_DATABASE_URL"], // Declarar o segredo que a função precisa acessar
  // region: "us-central1", // Opcional: Especifique a região se não for a padrão
  // timeoutSeconds: 60, // Opcional: Ajuste o timeout se necessário
  // Adicione options para memória, CPU, etc. se necessário
}, async (request: CallableRequest) => { // <-- O tipo do request agora é CallableRequest. response não é mais um parâmetro direto.

  // *** AUTENTICAÇÃO AUTOMÁTICA DA FUNÇÃO ONCALL ***
  if (!request.auth) {
    logger.warn("Acesso negado: Chamada não autenticada para testDbConnection.");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Autenticação necessária para acessar esta função."
    );
  }

  const userUid = request.auth.uid;
  logger.info(`Função chamada por usuário autenticado (UID: ${userUid}).`, { structuredData: true });

  // *** VALIDAÇÃO DO SEGREDO DENTRO DO HANDLER (ESSENCIAL) ***
  const currentNeonDbUrl = process.env.NEON_DATABASE_URL;
   if (!currentNeonDbUrl) {
       // Este erro ocorrerá se o segredo não for injetado corretamente no runtime
       logger.error("NEON_DATABASE_URL secret is unexpectedly missing within the function execution context.");
       throw new functions.https.HttpsError(
          "internal",
          "Erro interno do servidor: Configuração do banco de dados inacessível."
        );
   }

  logger.info("Iniciando operação de banco de dados...");

  let client;
  try {
    // A conexão só é tentada aqui, usando a connectionString definida na criação do Pool
    client = await pool.connect();
    logger.info("Cliente PG conectado do pool com sucesso!");

    const result = await client.query("SELECT NOW() AS current_time");
    if (!result.rows || result.rows.length === 0) {
        throw new Error("Consulta ao banco de dados não retornou a hora atual.");
    }
    const currentTime = result.rows[0].current_time;
    logger.info(`Consulta SELECT NOW() bem-sucedida. Hora do servidor: ${currentTime}`);

    return {
      message: "Conexão com o banco de dados Neon bem-sucedida!",
      serverTime: currentTime instanceof Date ? currentTime.toISOString() : String(currentTime),
      authenticatedUid: userUid,
    };

  } catch (error: any) {
    logger.error("Erro ao conectar ou consultar o banco de dados:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erro interno ao acessar o banco de dados.",
      { errorMessage: error.message || "Detalhes do erro desconhecido" }
    );

  } finally {
    if (client) {
      client.release();
      logger.info("Cliente PG liberado de volta para o pool.");
    }
  }
});

// Adicione outras funções callable ou onRequest aqui se necessário.

