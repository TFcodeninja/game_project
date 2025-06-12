# 🎮 Backend - Jump Game API (Symfony 7)

Ce dépôt contient le backend REST API de notre mini-jeu de plateforme développé avec **Symfony 7**. Il gère l'inscription, la connexion des utilisateurs (via JWT), et le stockage des scores en base de données.

---

## 🚀 Stack technique

- **Framework** : Symfony 7
- **ORM** : Doctrine
- **Authentification** : JWT (LexikJWTAuthenticationBundle)
- **Base de données** : MySQL (gérée localement via MAMP)
- **Langage** : PHP 8+

---

## 🗂 Fonctionnalités

- ✅ Enregistrement d'un utilisateur (`/api/register`)
- ✅ Connexion d'un utilisateur (`/api/login`) avec génération d’un **token JWT**
- ✅ Sauvegarde automatique des scores et des kills
- ✅ Sécurité avec JWT + Password Hasher
- ✅ Routes REST sécurisées

---

## ⚙️ Installation

### 1. Clone du dépôt
```bash
git clone https://github.com/TON_USER/game_projectback.git
cd game_projectback
