
let expresion = "";
let modoGrados = true;
let error = false;
let calculado = false;

const pantalla = document.getElementById("resultado");

function mostrar() {
    pantalla.textContent = expresion || "0";
}

function agregar(valor) {
    if (error) {
        expresion = "";
        error = false;
    }

    if (calculado) {
        if (!["+", "-", "×", "÷", "^", "%"].includes(valor)) {
            expresion = "";
        }
        calculado = false;
    }

    expresion += valor;
    mostrar();
}

function limpiar() {
    expresion = "";
    error = false;
    calculado = false;
    mostrar();
}

function borrar() {
    if (error) {
        limpiar();
        return;
    }

    const funciones = ["sin(", "cos(", "tan("];

    const ultima = funciones.find(f => expresion.endsWith(f));

    if (ultima) {
        expresion = expresion.slice(0, -ultima.length);
    } else if (expresion.endsWith("√(")) {
        expresion = expresion.slice(0, -2);
    } else {
        expresion = expresion.slice(0, -1);
    }

    calculado = false;
    mostrar();
}

function cambiarModo() {
    modoGrados = !modoGrados;

    document.getElementById("modo").textContent =
        modoGrados ? "Modo: DEG" : "Modo: RAD";

    document.getElementById("btnModo").textContent =
        modoGrados ? "DEG" : "RAD";
}

function calcular() {
    try {
        if (!expresion) return;

        const tokens = tokenizar(expresion);
        let posicion = 0;

        function actual() {
            return tokens[posicion];
        }

        function consumir(tipo) {
            if (actual() === tipo) {
                posicion++;
                return true;
            }
            return false;
        }

        function numero() {
            const token = actual();

            if (token === "(") {
                posicion++;
                const valor = suma();

                if (!consumir(")")) {
                    throw Error("Falta cerrar paréntesis");
                }

                return valor;
            }

            if (token === "π") {
                posicion++;
                return Math.PI;
            }

            if (["sin", "cos", "tan", "√"].includes(token)) {
                posicion++;
                if (!consumir("(")) throw Error("Falta paréntesis");

                const valor = suma();

                if (!consumir(")")) throw Error("Falta cerrar paréntesis");

                return funcion(token, valor);
            }

            if (token !== undefined && /^\d+(\.\d*)?$|^\.\d+$/.test(token)) {
                posicion++;
                return Number(token);
            }

            throw Error("Expresión incorrecta");
        }

        function potencia() {
            let valor = numero();

            while (consumir("%")) {
                valor /= 100;
            }

            if (consumir("^")) {
                valor = Math.pow(valor, unario());
            }

            return verificar(valor);
        }

        function unario() {
            if (consumir("+")) return unario();
            if (consumir("-")) return -unario();
            return potencia();
        }

        function multiplicacion() {
            let valor = unario();

            while (actual() === "×" || actual() === "÷") {
                const operador = tokens[posicion++];
                const siguiente = unario();

                if (operador === "×") {
                    valor *= siguiente;
                } else {
                    if (siguiente === 0) {
                        throw Error("División entre cero");
                    }
                    valor /= siguiente;
                }

                verificar(valor);
            }

            return valor;
        }

        function suma() {
            let valor = multiplicacion();

            while (actual() === "+" || actual() === "-") {
                const operador = tokens[posicion++];
                const siguiente = multiplicacion();

                valor = operador === "+"
                    ? valor + siguiente
                    : valor - siguiente;

                verificar(valor);
            }

            return valor;
        }

        let resultado = suma();

        if (posicion !== tokens.length) {
            throw Error("Expresión incorrecta");
        }

        resultado = verificar(resultado);

        if (Math.abs(resultado) < 1e-12) {
            resultado = 0;
        }

        expresion = String(Number(resultado.toPrecision(12)));
        calculado = true;
        mostrar();

    } catch (e) {
        pantalla.textContent = "Error: " + e.message;
        error = true;
        calculado = false;
    }
}

function tokenizar(texto) {
    const tokens = [];
    let i = 0;

    while (i < texto.length) {
        const resto = texto.slice(i);

        const funcion = /^(sin|cos|tan)/.exec(resto);

        if (funcion) {
            tokens.push(funcion[0]);
            i += funcion[0].length;
            continue;
        }

        const numero = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(resto);

        if (numero) {
            tokens.push(numero[0]);
            i += numero[0].length;
            continue;
        }

        const caracter = texto[i];

        if ("+-×÷^%()π√".includes(caracter)) {
            tokens.push(caracter);
            i++;
            continue;
        }

        throw Error("Carácter no permitido");
    }

    return tokens;
}

function verificar(valor) {
    if (!Number.isFinite(valor)) {
        throw Error("Resultado no válido");
    }
    return valor;
}

function funcion(nombre, valor) {
    if (nombre === "√") {
        if (valor < 0) throw Error("Raíz negativa");
        return Math.sqrt(valor);
    }

    const angulo = modoGrados
        ? valor * Math.PI / 180
        : valor;

    if (nombre === "sin") return Math.sin(angulo);
    if (nombre === "cos") return Math.cos(angulo);

    if (nombre === "tan") {
        if (Math.abs(Math.cos(angulo)) < 1e-12) {
            throw Error("Tangente indefinida");
        }
        return Math.tan(angulo);
    }

    throw Error("Función desconocida");
}
