function generateUUID4() {
    return (
        (1e7.toString() + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c:any) =>
            (
                c ^
                (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
            ).toString(16),
        )
    );
}

function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$/;
    return uuidRegex.test(uuid);
  }

export { generateUUID4, isValidUUID };
