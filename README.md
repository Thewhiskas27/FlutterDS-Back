# Backend de mon devoir Flutter

## Introduction

Cette partie du projet utilise NodeJs pour l'API et une instance WSL Ubuntu avec mysql-server installé dessus.
Pour remplir la base de données après ceci, veuillez exécuter les commandes sur "commandes.sql" sur mysql-server.
Pour que le fichier index.js fonctionne, il vous faut renseigner des identifiants pour vous connecter à la base de données mysql-server.

## Routes de l'API

### Routes libres (Pas d'authentification réquise sur l'application)

#### POST /login

Permet de se connecter. Les paramètres sont les suivants:
- username: Le nom d'utilisateur
- password: Le mot de passe

#### POST /sign-up

Permet de s'inscrire. Les paramètres sont les suivants:
- username: Le nom d'utilisateur
- password: Le mot de passe

### Routes qui requièrent l'authentification sur l'application

#### GET /available-slots

Permet de récupérer les créneaux disponibles. Il n'y a pas de paramètres à renseigner

#### POST /reservations

Permet de créer une réservation si le créneau est libre. Les paramètres sont les suivants:
- name: Le nom de la personne qui fait la réservation
- numberOfPeople: Le nombre de personnes pour la réservation
- date: La date de la réservation
- time: Le créneau