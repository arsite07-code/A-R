from __future__ import annotations

import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS


def criar_app() -> Flask:
    app = Flask(__name__)
    CORS(app)  # permite chamadas do frontend via fetch

    # Banco SQLite local
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(backend_dir, "banco.db")

    # Cria tabela automaticamente
    init_db(db_path)

    @app.post("/compras")
    def post_compras():
        # Espera JSON: { nome, produto, preco }
        dados = request.get_json(silent=True) or {}

        nome = (dados.get("nome") or "").strip()
        produto = (dados.get("produto") or "").strip()
        preco = dados.get("preco")

        # Validações simples
        if not nome:
            return jsonify({"erro": "campo 'nome' é obrigatório"}), 400
        if not produto:
            return jsonify({"erro": "campo 'produto' é obrigatório"}), 400

        try:
            preco_float = float(preco)
        except (TypeError, ValueError):
            return jsonify({"erro": "campo 'preco' deve ser numérico"}), 400

        # Salva no banco
        with sqlite3.connect(db_path) as con:
            cur = con.cursor()
            cur.execute(
                """
                INSERT INTO compras (nome, produto, preco)
                VALUES (?, ?, ?)
                """,
                (nome, produto, preco_float),
            )
            compra_id = cur.lastrowid

        return jsonify({"ok": True, "id": compra_id}), 201

    @app.get("/compras")
    def get_compras():
        with sqlite3.connect(db_path) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(
                """
                SELECT id, nome, produto, preco
                FROM compras
                ORDER BY id DESC
                """
            )
            rows = cur.fetchall()

        compras = [
            {
                "id": int(r["id"]),
                "nome": r["nome"],
                "produto": r["produto"],
                "preco": float(r["preco"]),
            }
            for r in rows
        ]
        return jsonify(compras)

    return app


def init_db(db_path: str) -> None:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS compras (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                produto TEXT NOT NULL,
                preco REAL NOT NULL
            )
            """
        )
        con.commit()


if __name__ == "__main__":
    # Rodar localmente: http://127.0.0.1:5000
    app = criar_app()
    app.run(host="127.0.0.1", port=5000, debug=True)

