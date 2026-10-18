use std::{env, fs, path::Path};
fn main() {
    let source = fs::read_to_string("sdk/bridge-lib.rs").unwrap();
    let start = source.find("    fn verify_payload<R>").unwrap();
    let end = source[start..].find("\n}\n").unwrap() + start;
    let methods = &source[start..end];
    let core = format!("// Generated from the pinned SDK BridgeActor methods, without changing their bodies.\n#[derive(Clone, Copy, Debug, Eq, PartialEq)]\nenum SubmitResult {{ Rejected, Updated, Stale }}\nstruct State {{ latest: BridgePayload }}\nstruct BridgeCore {{ foreign_network: Scheme, state: State }}\nimpl BridgeCore {{\n{methods}\n}}\n");
    fs::write(Path::new(&env::var("OUT_DIR").unwrap()).join("bridge-core.rs"), core).unwrap();
    println!("cargo:rerun-if-changed=sdk/bridge-lib.rs");
}
