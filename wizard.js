module.exports = function(app){
    var Wizard = Object.getPrototypeOf(app).Wizard = new app.Component("wizard");
    // Wizard.debug = true;
    Wizard.createdAt      = "2.0.0";
    Wizard.lastUpdate     = "2.0.0";
    Wizard.version        = "1";
    // Wizard.factoryExclude = true;
    // Wizard.loadingMsg     = "This message will display in the console when component will be loaded.";
    // Wizard.requires       = [];

    // Wizard.prototype.onCreate = function(){
    // do thing after element's creation
    // }
    return Wizard;
}