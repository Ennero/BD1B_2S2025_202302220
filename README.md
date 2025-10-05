# BD1B_2S2025_202302220

## Tabla de Contenidos
- [Manual Técnico - Proyecto 2](#manual-técnico---proyecto-2)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [1. Objetivos](#1-objetivos)
    - [1.1 Objetivo General](#11-objetivo-general)
    - [1.2 Objetivos Específicos](#12-objetivos-específicos)
  - [2. Alcance del Proyecto](#2-alcance-del-proyecto)
    - [2.1 Inclusiones](#21-inclusiones)
    - [2.2 Exclusiones](#22-exclusiones)
  - [3. Topología de Red](#3-topología-de-red)
    - [3.1 DIGA](#31-diga)
    - [3.2 Biblioteca](#32-biblioteca)
    - [3.3 Edificio T4](#33-edificio-t4)
    - [3.4 Edificio S11](#34-edificio-s11)
    - [3.5 Edificio S12](#35-edificio-s12)
    - [3.6 BACKBONE](#36-backbone)
  - [4. Tabla de Direccionamiento IP](#4-tabla-de-direccionamiento-ip)
    - [4.1 Direcciones de dispositivos](#41-direcciones-de-dispositivos)
      - [4.1.1 DIGA](#411-diga)
      - [4.1.2 Biblioteca](#412-biblioteca)
      - [4.1.3. Edificio T4](#413-edificio-t4)
      - [4.1.4 Edificio S11](#414-edificio-s11)
      - [4.1.5 Edificio S12](#415-edificio-s12)
    - [4.2 Direcciones de Puertas de enlace](#42-direcciones-de-puertas-de-enlace)
      - [4.2.1 DIGA](#421-diga)
      - [4.2.2 Biblioteca](#422-biblioteca)
      - [4.2.3. Edificio T4](#423-edificio-t4)
      - [4.2.4 Edificio S11](#424-edificio-s11)
      - [4.2.5 Edificio S12](#425-edificio-s12)
  - [5. Subnetting](#5-subnetting)
    - [5.1 DIGA](#51-diga)
    - [5.2 Biblioteca](#52-biblioteca)
    - [5.3 Edificio T4](#53-edificio-t4)
    - [5.4 Edificio S11](#54-edificio-s11)
    - [5.5 Edificio S12](#55-edificio-s12)
    - [5.6 BACKBONE](#56-backbone)
  - [6. Configuraciones de Dispositivos](#6-configuraciones-de-dispositivos)
    - [6.1 DIGA](#61-diga)
      - [6.1.1 Configuración Switches](#611-configuración-switches)
        - [6.1.1.1 SW3](#6111-sw3)
        - [6.1.1.2 SW4](#6112-sw4)
        - [6.1.1.2 SW5 (Servidor VTP)](#6112-sw5-servidor-vtp)
        - [6.1.1.2 SW6](#6112-sw6)
      - [6.1.2 Configuración Multiswitches](#612-configuración-multiswitches)
        - [6.1.2.1 MS1](#6121-ms1)
        - [6.1.2.2 MS2](#6122-ms2)
      - [6.1.3 Conexiones entre los switches](#613-conexiones-entre-los-switches)
      - [6.1.4 Conexiones a dispositivos finales](#614-conexiones-a-dispositivos-finales)
    - [6.2 Biblioteca](#62-biblioteca)
      - [6.2.1 Configuraciones Switches](#621-configuraciones-switches)
        - [6.2.1.1 SW0](#6211-sw0)
        - [6.2.1.2 SW1](#6212-sw1)
        - [6.2.1.3 Switch6](#6213-switch6)
      - [6.2.2 Configuración Multiswitch MS0 (Servidor VTP)](#622-configuración-multiswitch-ms0-servidor-vtp)
      - [6.2.3 Configuración Routers](#623-configuración-routers)
        - [6.2.3.1 R0](#6231-r0)
        - [6.2.3.2 R1](#6232-r1)
      - [6.2.4 Conexiones entre los switches y routers](#624-conexiones-entre-los-switches-y-routers)
      - [6.2.5 Conexiones a dispositivos finales](#625-conexiones-a-dispositivos-finales)
    - [6.3 Edificio T4](#63-edificio-t4)
      - [6.3.1 Configuraciones Switches](#631-configuraciones-switches)
        - [6.3.1.1 SW7](#6311-sw7)
        - [6.3.1.2 SW8 (Servidor VTP)](#6312-sw8-servidor-vtp)
        - [6.3.1.3 SW9](#6313-sw9)
      - [6.3.2 Configuración Multiswitch MS5](#632-configuración-multiswitch-ms5)
      - [6.3.3 Conexiones entre los switches](#633-conexiones-entre-los-switches)
      - [6.3.4 Conexiones a dispositivos finales](#634-conexiones-a-dispositivos-finales)
    - [6.4 Edificio S11](#64-edificio-s11)
      - [6.4.1 Configuraciones Switches](#641-configuraciones-switches)
        - [6.4.1.1 SW10](#6411-sw10)
        - [6.4.1.1 SW11 (Servidor VTP)](#6411-sw11-servidor-vtp)
        - [6.4.1.1 SW12](#6411-sw12)
      - [6.4.2 Configuración Routers](#642-configuración-routers)
        - [6.4.2.1 R10](#6421-r10)
        - [6.4.2.2 R11](#6422-r11)
      - [6.4.3 Conexiones entre los switches](#643-conexiones-entre-los-switches)
      - [6.4.4 Conexiones a dispositivos finales](#644-conexiones-a-dispositivos-finales)
    - [6.5 Edificio S12](#65-edificio-s12)
      - [6.5.1 Configuraciones Switches](#651-configuraciones-switches)
        - [6.5.1.1 SW13](#6511-sw13)
        - [6.5.1.2 SW14](#6512-sw14)
        - [6.5.1.3 SW15](#6513-sw15)
        - [6.5.1.4 SW16](#6514-sw16)
        - [6.5.1.5 SW17](#6515-sw17)
      - [6.5.2 Configuración Multiswitches](#652-configuración-multiswitches)
        - [6.5.1.3 MS7](#6513-ms7)
        - [6.5.1.3 MS8](#6513-ms8)
        - [6.5.1.3 MS9 (Servidor VTP)](#6513-ms9-servidor-vtp)
      - [6.5.3 Conexiones entre los switches](#653-conexiones-entre-los-switches)
      - [6.5.4 Conexiones a dispositivos finales](#654-conexiones-a-dispositivos-finales)
    - [6.6 BACKBONE](#66-backbone)
    - [6.6.1 Configuración Routers](#661-configuración-routers)
      - [6.6.1.1 R2](#6611-r2)
      - [6.6.1.2 R3](#6612-r3)
      - [6.6.1.3 R4](#6613-r4)
      - [6.6.1.4 R5](#6614-r5)
      - [6.6.1.5 R6](#6615-r6)
      - [6.6.1.6 R7](#6616-r7)
      - [6.6.1.7 R8](#6617-r8)
      - [6.6.1.7 R9](#6617-r9)
    - [6.6.2 Configuración de MultiSwitches](#662-configuración-de-multiswitches)
      - [6.6.2.1 MS3](#6621-ms3)
      - [6.6.2.1 MS4](#6621-ms4)
      - [6.6.2.1 MS6](#6621-ms6)
      - [6.6.3 RIP (Routing Information Protocol)](#663-rip-routing-information-protocol)
      - [6.6.4 OSPF (Open Shortest Path First)](#664-ospf-open-shortest-path-first)
      - [6.6.5 EIGRP (Enhances Interior Gateway Routing Protocol)](#665-eigrp-enhances-interior-gateway-routing-protocol)
      - [6.6.6 Rutas Estáticas](#666-rutas-estáticas)


## 1. Objetivos

### 1.1 Objetivo General
 Diseñar e implementar un backend portable, versionado y reproducible para la base de datos de los Centros de Evaluación, empleando Docker para la infraestructura, DBeaver para la administración y una API REST desarrollada en Node.js/Express para exponer operaciones CRUD y consultas predefinidas.

### 1.2 Objetivos Específicos
* **Contenerizar** la base de datos del sistema utilizando Docker y Docker Compose para garantizar un entorno de desarrollo y despliegue consistente.
* **Configurar** y validar la conexión y administración de la base de datos desde el cliente DBeaver.
* **Desarrollar** una API REST utilizando Node.js y el framework Express que sirva como interfaz para interactuar con la base de datos.
* **Implementar** los endpoints necesarios para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en todas las tablas del modelo relacional.
* **Definir** y exponer mediante endpoints específicos tres consultas SQL estandarizadas y de utilidad para el sistema.
* **Documentar** y validar el funcionamiento de todos los endpoints de la API REST a través de una colección de pruebas en Postman.
---

## 2. Alcance del Proyecto

### 2.1 Inclusiones
* El desarrollo se centra en la creación de un **backend dockerizado** que incluye la base de datos y la API REST.
* La configuración de la base de datos se realiza a través de un archivo ```docker-compose.yml``` y se inicializa con un script DDL proporcionado.
* Implementación de una **API REST** con endpoints para todas las operaciones CRUD y tres consultas SQL específicas.
* Creación de una guía en el archivo ```README.md``` para el despliegue del proyecto y el uso de los endpoints.
* Validación y documentación de toda la API mediante una **colección de Postman** exportada.
* El código fuente completo se gestionará y entregará a través de un **repositorio en GitHub**.

### 2.2 Exclusiones
* El desarrollo de una interfaz de usuario o **frontend** para consumir la API.
* El despliegue del sistema en un entorno de producción o en servicios en la nube.
* La implementación de mecanismos de **autenticación o autorización** para los endpoints de la API.
* El diseño del modelo relacional de la base de datos.
* Configuración de pipelines de Integración Continua y Despliegue Continuo.



## 3. Descripción



## 4. Pasos de Despliegue


## 5. Guía DBeaver




## 6. Uso de Endpoints


## 7. Capturas de evidencias




