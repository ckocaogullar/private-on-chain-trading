__all__ = ['deversifi']

# Don't look below, you will not understand this Python code :) I don't.

from js2py.pyjs import *
# setting scope
var = Scope( JS_BUILTINS )
set_global_object(var)

# Code follows:
var.registers([])
@Js
def PyJs_anonymous_0_(this, arguments, var=var):
    var = Scope({'this':this, 'arguments':arguments}, var)
    var.registers([])
    Js('use strict')
    PyJsComma(var.put('DVF', var.get('require')(Js('dvf-client-js'))),var.get('require')(Js('web3')).create(var.get('require')(Js('@truffle/hdwallet-provider')).create(Js('bc6d600f6bf2a5ad83377dd8743e5fe30b14064ea8e082f3a83ee704cca0cfc0'), Js('https://eth-ropsten.alchemyapi.io/v2/fBCbSZh46WyftFgzBU-a8_tIgCCxEL22'))))
PyJs_anonymous_0_._set_name('anonymous')
PyJs_anonymous_0_().neg()
pass


# Add lib to the module scope
deversifi = var.to_python()